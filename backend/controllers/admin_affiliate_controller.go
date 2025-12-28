package controllers

import (
	"BACKEND/config"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================================
// AFFILIATE APPLICATIONS MANAGEMENT
// ========================================================

// GetAllAffiliateApplications - List all affiliate applications
func GetAllAffiliateApplications(c *gin.Context) {
	status := c.Query("status")

	var apps []struct {
		ID         int64   `db:"id" json:"id"`
		UserID     int64   `db:"user_id" json:"user_id"`
		UserName   string  `db:"user_name" json:"user_name"`
		UserEmail  string  `db:"user_email" json:"user_email"`
		Motivation *string `db:"motivation" json:"motivation"`
		Status     string  `db:"status" json:"status"`
		CreatedAt  string  `db:"created_at" json:"created_at"`
	}

	query := `
		SELECT aa.id, aa.user_id, u.name as user_name, u.email as user_email,
		       aa.motivation, aa.status, aa.created_at
		FROM affiliate_applications aa
		JOIN users u ON aa.user_id = u.id
	`
	if status != "" {
		query += " WHERE aa.status = '" + status + "'"
	}
	query += " ORDER BY aa.created_at DESC"

	if err := config.DB.Select(&apps, query); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"applications": apps})
}

// ReviewAffiliateApplication - Approve or reject affiliate application
func ReviewAffiliateApplication(c *gin.Context) {
	adminID := c.GetInt64("user_id")
	appID := c.Param("id")

	var input struct {
		Action string `json:"action"` // APPROVE or REJECT
		Note   string `json:"note"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	// Get application
	var app struct {
		ID     int64  `db:"id"`
		UserID int64  `db:"user_id"`
		Status string `db:"status"`
	}
	err := config.DB.Get(&app, `SELECT id, user_id, status FROM affiliate_applications WHERE id = ?`, appID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Permohonan tidak ditemukan"})
		return
	}

	if app.Status != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Permohonan sudah diproses"})
		return
	}

	newStatus := "REJECTED"
	if input.Action == "APPROVE" {
		newStatus = "APPROVED"

		// Add AFFILIATE role to user
		config.DB.Exec(`
			INSERT INTO user_roles (user_id, role_id)
			SELECT ?, id FROM roles WHERE name = 'AFFILIATE'
		`, app.UserID)

		// Send notification
		config.DB.Exec(`
			INSERT INTO notifications (user_id, title, message)
			VALUES (?, 'Selamat! Permohonan Affiliate Disetujui', 'Sekarang Anda dapat mengajukan event dan mendapatkan penghasilan dari penjualan.')
		`, app.UserID)
	} else {
		// Send rejection notification
		config.DB.Exec(`
			INSERT INTO notifications (user_id, title, message)
			VALUES (?, 'Permohonan Affiliate Ditolak', ?)
		`, app.UserID, input.Note)
	}

	// Update application
	config.DB.Exec(`
		UPDATE affiliate_applications 
		SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ?
		WHERE id = ?
	`, newStatus, adminID, input.Note, appID)

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Permohonan berhasil di%s", map[string]string{"APPROVED": "setujui", "REJECTED": "tolak"}[newStatus])})
}

// ========================================================
// AFFILIATE SUBMISSIONS MANAGEMENT
// ========================================================

// GetAllAffiliateSubmissions - List all affiliate event submissions
func GetAllAffiliateSubmissions(c *gin.Context) {
	status := c.Query("status")

	var submissions []struct {
		ID           int64   `db:"id" json:"id"`
		UserID       *int64  `db:"user_id" json:"user_id"`
		FullName     string  `db:"full_name" json:"full_name"`
		Email        string  `db:"email" json:"email"`
		EventTitle   string  `db:"event_title" json:"event_title"`
		EventPrice   int64   `db:"event_price" json:"event_price"`
		Status       string  `db:"status" json:"status"`
		HasVideo     bool    `db:"has_video" json:"has_video"`
		HasFile      bool    `db:"has_file" json:"has_file"`
		ReviewerName *string `db:"reviewer_name" json:"reviewer_name"`
		CreatedAt    string  `db:"created_at" json:"created_at"`
	}

	query := `
		SELECT asub.id, asub.user_id, asub.full_name, asub.email, asub.event_title, 
		       asub.event_price, asub.status,
		       CASE WHEN asub.video_url IS NOT NULL AND asub.video_url != '' THEN 1 ELSE 0 END as has_video,
		       CASE WHEN asub.file_url IS NOT NULL AND asub.file_url != '' THEN 1 ELSE 0 END as has_file,
		       u.name as reviewer_name, asub.created_at
		FROM affiliate_submissions asub
		LEFT JOIN users u ON asub.reviewed_by = u.id
	`
	if status != "" {
		query += " WHERE asub.status = '" + status + "'"
	}
	query += " ORDER BY asub.created_at DESC"

	if err := config.DB.Select(&submissions, query); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"submissions": submissions})
}

// GetAffiliateSubmissionByID - Get submission detail for admin review
func GetAffiliateSubmissionByID(c *gin.Context) {
	submissionID := c.Param("id")

	var submission struct {
		ID                int64   `db:"id" json:"id"`
		UserID            *int64  `db:"user_id" json:"user_id"`
		FullName          string  `db:"full_name" json:"full_name"`
		Email             string  `db:"email" json:"email"`
		Phone             *string `db:"phone" json:"phone"`
		EventTitle        string  `db:"event_title" json:"event_title"`
		EventDescription  *string `db:"event_description" json:"event_description"`
		EventPrice        int64   `db:"event_price" json:"event_price"`
		PosterURL         *string `db:"poster_url" json:"poster_url"`
		VideoURL          *string `db:"video_url" json:"video_url"`
		VideoTitle        *string `db:"video_title" json:"video_title"`
		FileURL           *string `db:"file_url" json:"file_url"`
		FileTitle         *string `db:"file_title" json:"file_title"`
		BankName          *string `db:"bank_name" json:"bank_name"`
		BankAccountNumber *string `db:"bank_account_number" json:"bank_account_number"`
		BankAccountHolder *string `db:"bank_account_holder" json:"bank_account_holder"`
		Status            string  `db:"status" json:"status"`
		ReviewerName      *string `db:"reviewer_name" json:"reviewer_name"`
		ReviewedAt        *string `db:"reviewed_at" json:"reviewed_at"`
		ReviewNote        *string `db:"review_note" json:"review_note"`
		CreatedAt         string  `db:"created_at" json:"created_at"`
	}

	err := config.DB.Get(&submission, `
		SELECT asub.*, u.name as reviewer_name
		FROM affiliate_submissions asub
		LEFT JOIN users u ON asub.reviewed_by = u.id
		WHERE asub.id = ?
	`, submissionID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengajuan tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"submission": submission})
}

// ReviewAffiliateSubmission - Approve or reject affiliate event submission
func ReviewAffiliateSubmission(c *gin.Context) {
	adminID := c.GetInt64("user_id")
	submissionID := c.Param("id")

	var input struct {
		Action string `json:"action"` // APPROVE or REJECT
		Note   string `json:"note"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	// Get submission
	var submission struct {
		ID               int64   `db:"id"`
		UserID           *int64  `db:"user_id"`
		FullName         string  `db:"full_name"`
		Email            string  `db:"email"`
		EventTitle       string  `db:"event_title"`
		EventDescription *string `db:"event_description"`
		EventPrice       int64   `db:"event_price"`
		PosterURL        *string `db:"poster_url"`
		VideoURL         *string `db:"video_url"`
		VideoTitle       *string `db:"video_title"`
		FileURL          *string `db:"file_url"`
		FileTitle        *string `db:"file_title"`
		Status           string  `db:"status"`
	}
	err := config.DB.Get(&submission, `SELECT * FROM affiliate_submissions WHERE id = ?`, submissionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengajuan tidak ditemukan"})
		return
	}

	if submission.Status != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pengajuan sudah diproses"})
		return
	}

	if input.Action == "APPROVE" {
		// Get Official organization
		var officialOrgID int64
		err := config.DB.Get(&officialOrgID, `SELECT id FROM organizations WHERE name = 'Official' LIMIT 1`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Organisasi Official belum dibuat"})
			return
		}

		// Create event under Official org
		description := ""
		if submission.EventDescription != nil {
			description = *submission.EventDescription
		}

		eventResult, err := config.DB.Exec(`
			INSERT INTO events (organization_id, title, description, category, thumbnail_url, 
			                    publish_status, affiliate_submission_id)
			VALUES (?, ?, ?, 'Affiliate', ?, 'PUBLISHED', ?)
		`, officialOrgID, submission.EventTitle, description, submission.PosterURL, submission.ID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat event"})
			return
		}

		eventID, _ := eventResult.LastInsertId()

		// Create session
		sessionResult, err := config.DB.Exec(`
			INSERT INTO sessions (event_id, title, description, price, publish_status)
			VALUES (?, ?, ?, ?, 'PUBLISHED')
		`, eventID, submission.EventTitle, description, submission.EventPrice)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat session"})
			return
		}

		sessionID, _ := sessionResult.LastInsertId()

		// Copy materials to session
		if submission.VideoURL != nil && *submission.VideoURL != "" {
			// Copy video file to session videos folder
			videoTitle := "Video Materi"
			if submission.VideoTitle != nil && *submission.VideoTitle != "" {
				videoTitle = *submission.VideoTitle
			}

			// Generate new filename
			ext := filepath.Ext(*submission.VideoURL)
			newFilename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
			newPath := filepath.Join("uploads/videos", newFilename)

			// Copy file
			os.MkdirAll("uploads/videos", os.ModePerm)
			copyFile(*submission.VideoURL, newPath)

			config.DB.Exec(`
				INSERT INTO session_videos (session_id, title, filename)
				VALUES (?, ?, ?)
			`, sessionID, videoTitle, newFilename)
		}

		if submission.FileURL != nil && *submission.FileURL != "" {
			fileTitle := "Modul Materi"
			if submission.FileTitle != nil && *submission.FileTitle != "" {
				fileTitle = *submission.FileTitle
			}

			ext := filepath.Ext(*submission.FileURL)
			newFilename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
			newPath := filepath.Join("uploads/files", newFilename)

			os.MkdirAll("uploads/files", os.ModePerm)
			copyFile(*submission.FileURL, newPath)

			config.DB.Exec(`
				INSERT INTO session_files (session_id, title, filename)
				VALUES (?, ?, ?)
			`, sessionID, fileTitle, newFilename)
		}

		// Update submission status
		config.DB.Exec(`
			UPDATE affiliate_submissions 
			SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), review_note = ?
			WHERE id = ?
		`, adminID, input.Note, submissionID)

		// Add AFFILIATE role to user if not already has it
		if submission.UserID != nil {
			// Check if user already has AFFILIATE role
			var hasRole int
			config.DB.Get(&hasRole, `
				SELECT COUNT(*) FROM user_roles ur
				JOIN roles r ON ur.role_id = r.id
				WHERE ur.user_id = ? AND r.name = 'AFFILIATE'
			`, *submission.UserID)

			// Add AFFILIATE role if not exists (ADD, not replace)
			if hasRole == 0 {
				config.DB.Exec(`
					INSERT INTO user_roles (user_id, role_id)
					SELECT ?, id FROM roles WHERE name = 'AFFILIATE'
				`, *submission.UserID)
			}

			// Send notification
			config.DB.Exec(`
				INSERT INTO notifications (user_id, title, message)
				VALUES (?, 'Event Anda Disetujui!', ?)
			`, *submission.UserID, fmt.Sprintf("Event '%s' telah dipublikasikan dan siap dijual.", submission.EventTitle))
		}

		c.JSON(http.StatusOK, gin.H{
			"message":  "Event berhasil dipublikasikan",
			"event_id": eventID,
		})

	} else {
		// Reject
		config.DB.Exec(`
			UPDATE affiliate_submissions 
			SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), review_note = ?
			WHERE id = ?
		`, adminID, input.Note, submissionID)

		if submission.UserID != nil {
			config.DB.Exec(`
				INSERT INTO notifications (user_id, title, message)
				VALUES (?, 'Event Anda Ditolak', ?)
			`, *submission.UserID, input.Note)
		}

		c.JSON(http.StatusOK, gin.H{"message": "Pengajuan ditolak"})
	}
}

// Helper function to copy file
func copyFile(src, dst string) error {
	input, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, input, 0644)
}

// ========================================================
// AFFILIATE LEDGERS
// ========================================================

// GetAffiliateLedgers - List all affiliate ledger entries
func GetAffiliateLedgers(c *gin.Context) {
	isPaidOut := c.Query("is_paid_out")

	var ledgers []struct {
		ID                int64   `db:"id" json:"id"`
		OrderID           string  `db:"order_id" json:"order_id"`
		TransactionAmount float64 `db:"transaction_amount" json:"transaction_amount"`
		PlatformFee       float64 `db:"platform_fee" json:"platform_fee"`
		AffiliateAmount   float64 `db:"affiliate_amount" json:"affiliate_amount"`
		IsPaidOut         bool    `db:"is_paid_out" json:"is_paid_out"`
		PaidOutAt         *string `db:"paid_out_at" json:"paid_out_at"`
		AffiliateFullName string  `db:"affiliate_full_name" json:"affiliate_full_name"`
		AffiliateEmail    string  `db:"affiliate_email" json:"affiliate_email"`
		EventTitle        string  `db:"event_title" json:"event_title"`
		CreatedAt         string  `db:"created_at" json:"created_at"`
	}

	query := `
		SELECT al.id, al.order_id, al.transaction_amount, al.platform_fee, 
		       al.affiliate_amount, al.is_paid_out, al.paid_out_at,
		       asub.full_name as affiliate_full_name, asub.email as affiliate_email,
		       asub.event_title, al.created_at
		FROM affiliate_ledgers al
		JOIN affiliate_submissions asub ON al.affiliate_submission_id = asub.id
	`
	if isPaidOut != "" {
		query += " WHERE al.is_paid_out = " + isPaidOut
	}
	query += " ORDER BY al.created_at DESC"

	config.DB.Select(&ledgers, query)

	c.JSON(http.StatusOK, gin.H{"ledgers": ledgers})
}

// MarkAffiliatePaidOut - Mark ledger entry as paid
func MarkAffiliatePaidOut(c *gin.Context) {
	ledgerID := c.Param("id")

	// Get ledger and affiliate info
	var ledger struct {
		ID                    int64 `db:"id"`
		AffiliateSubmissionID int64 `db:"affiliate_submission_id"`
		IsPaidOut             bool  `db:"is_paid_out"`
	}
	err := config.DB.Get(&ledger, `SELECT id, affiliate_submission_id, is_paid_out FROM affiliate_ledgers WHERE id = ?`, ledgerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ledger tidak ditemukan"})
		return
	}

	if ledger.IsPaidOut {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sudah dibayar sebelumnya"})
		return
	}

	// Mark as paid
	config.DB.Exec(`UPDATE affiliate_ledgers SET is_paid_out = 1, paid_out_at = NOW() WHERE id = ?`, ledgerID)

	// Notify affiliate
	var userID *int64
	config.DB.Get(&userID, `SELECT user_id FROM affiliate_submissions WHERE id = ?`, ledger.AffiliateSubmissionID)
	if userID != nil {
		config.DB.Exec(`
			INSERT INTO notifications (user_id, title, message)
			VALUES (?, 'Pembayaran Diterima', 'Pembayaran affiliate Anda telah ditransfer.')
		`, *userID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Berhasil ditandai sebagai sudah dibayar"})
}

// GetAffiliateLedgerStats - Get statistics
func GetAffiliateLedgerStats(c *gin.Context) {
	var stats struct {
		TotalSubmissions    int     `db:"total_submissions" json:"total_submissions"`
		PendingSubmissions  int     `db:"pending_submissions" json:"pending_submissions"`
		ApprovedSubmissions int     `db:"approved_submissions" json:"approved_submissions"`
		RejectedSubmissions int     `db:"rejected_submissions" json:"rejected_submissions"`
		TotalRevenue        float64 `db:"total_revenue" json:"total_revenue"`
		TotalPlatformFee    float64 `db:"total_platform_fee" json:"total_platform_fee"`
		PendingPayout       float64 `db:"pending_payout" json:"pending_payout"`
		CompletedPayout     float64 `db:"completed_payout" json:"completed_payout"`
		TotalAffiliates     int     `db:"total_affiliates" json:"total_affiliates"`
	}

	config.DB.Get(&stats.TotalSubmissions, `SELECT COUNT(*) FROM affiliate_submissions`)
	config.DB.Get(&stats.PendingSubmissions, `SELECT COUNT(*) FROM affiliate_submissions WHERE status = 'PENDING'`)
	config.DB.Get(&stats.ApprovedSubmissions, `SELECT COUNT(*) FROM affiliate_submissions WHERE status = 'APPROVED'`)
	config.DB.Get(&stats.RejectedSubmissions, `SELECT COUNT(*) FROM affiliate_submissions WHERE status = 'REJECTED'`)
	config.DB.Get(&stats.TotalRevenue, `SELECT COALESCE(SUM(transaction_amount), 0) FROM affiliate_ledgers`)
	config.DB.Get(&stats.TotalPlatformFee, `SELECT COALESCE(SUM(platform_fee), 0) FROM affiliate_ledgers`)
	config.DB.Get(&stats.PendingPayout, `SELECT COALESCE(SUM(affiliate_amount), 0) FROM affiliate_ledgers WHERE is_paid_out = 0`)
	config.DB.Get(&stats.CompletedPayout, `SELECT COALESCE(SUM(affiliate_amount), 0) FROM affiliate_ledgers WHERE is_paid_out = 1`)
	config.DB.Get(&stats.TotalAffiliates, `SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'AFFILIATE'`)

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// ========================================================
// OFFICIAL ORGANIZATION MANAGEMENT
// ========================================================

// GetOfficialOrganization - Get Official org details
func GetOfficialOrganization(c *gin.Context) {
	var org struct {
		ID          int64   `db:"id" json:"id"`
		Name        string  `db:"name" json:"name"`
		Description *string `db:"description" json:"description"`
		Category    *string `db:"category" json:"category"`
		Email       *string `db:"email" json:"email"`
		LogoURL     *string `db:"logo_url" json:"logo_url"`
		TotalEvents int     `db:"total_events" json:"total_events"`
	}

	err := config.DB.Get(&org, `
		SELECT o.id, o.name, o.description, o.category, o.email, o.logo_url,
		       (SELECT COUNT(*) FROM events WHERE organization_id = o.id) as total_events
		FROM organizations o
		WHERE o.name = 'Official'
		LIMIT 1
	`)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organisasi Official belum dibuat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"organization": org})
}

// UpdateOfficialOrganization - Update Official org by admin
func UpdateOfficialOrganization(c *gin.Context) {
	var input struct {
		Description string `json:"description"`
		Category    string `json:"category"`
		Email       string `json:"email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	_, err := config.DB.Exec(`
		UPDATE organizations 
		SET description = ?, category = ?, email = ?
		WHERE name = 'Official'
	`, input.Description, input.Category, input.Email)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Organisasi Official berhasil diupdate"})
}

// UploadOfficialOrgLogo - Upload logo for Official org
func UploadOfficialOrgLogo(c *gin.Context) {
	file, err := c.FormFile("logo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File tidak ditemukan"})
		return
	}

	os.MkdirAll("uploads/logos", os.ModePerm)
	filename := fmt.Sprintf("official_%d%s", time.Now().UnixNano(), filepath.Ext(file.Filename))
	path := filepath.Join("uploads/logos", filename)

	if err := c.SaveUploadedFile(file, path); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan file"})
		return
	}

	config.DB.Exec(`UPDATE organizations SET logo_url = ? WHERE name = 'Official'`, path)

	c.JSON(http.StatusOK, gin.H{"message": "Logo berhasil diupload", "logo_url": path})
}
