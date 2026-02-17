package controllers

import (
	"BACKEND/config"
	"BACKEND/utils"
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
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
		SELECT asub.id, asub.user_id, asub.full_name, asub.email, asub.phone,
		       asub.event_title, asub.event_description, asub.event_price,
		       asub.poster_url, asub.video_url, asub.video_title, asub.file_url, asub.file_title,
		       asub.bank_name, asub.bank_account_number, asub.bank_account_holder,
		       asub.status, asub.reviewed_at, asub.review_note, asub.created_at,
		       u.name as reviewer_name
		FROM affiliate_submissions asub
		LEFT JOIN users u ON asub.reviewed_by = u.id
		WHERE asub.id = ?
	`, submissionID)

	if err != nil {
		fmt.Printf("Error loading affiliate submission %s: %v\n", submissionID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengajuan tidak ditemukan"})
		return
	}

	// Fetch videos from affiliate_submission_videos table
	var videos []struct {
		ID    int64  `db:"id" json:"id"`
		Title string `db:"title" json:"title"`
		URL   string `db:"url" json:"url"`
	}
	config.DB.Select(&videos, `
		SELECT id, COALESCE(title, '') as title, url 
		FROM affiliate_submission_videos 
		WHERE submission_id = ? 
		ORDER BY id ASC
	`, submissionID)

	// Fetch files from affiliate_submission_files table
	var files []struct {
		ID    int64  `db:"id" json:"id"`
		Title string `db:"title" json:"title"`
		URL   string `db:"url" json:"url"`
	}
	config.DB.Select(&files, `
		SELECT id, COALESCE(title, '') as title, url
		FROM affiliate_submission_files 
		WHERE submission_id = ? 
		ORDER BY id ASC
	`, submissionID)

	c.JSON(http.StatusOK, gin.H{
		"submission": submission,
		"videos":     videos,
		"files":      files,
	})
}

// ReviewAffiliateSubmission - Approve or reject affiliate event submission
// APPROVE: Create event + session + transfer materials to session_videos/files
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

	// Get full submission data
	var submission struct {
		ID               int64   `db:"id"`
		UserID           *int64  `db:"user_id"`
		FullName         string  `db:"full_name"`
		Email            string  `db:"email"`
		EventTitle       string  `db:"event_title"`
		EventDescription *string `db:"event_description"`
		EventPrice       int64   `db:"event_price"`
		EventCategory    string  `db:"event_category"`
		PosterURL        *string `db:"poster_url"`
		VideoURL         *string `db:"video_url"`
		VideoTitle       *string `db:"video_title"`
		FileURL          *string `db:"file_url"`
		FileTitle        *string `db:"file_title"`
		Status           string  `db:"status"`
	}
	err := config.DB.Get(&submission, `
		SELECT id, user_id, full_name, email, event_title, event_description, 
		       event_price, COALESCE(event_category, 'Teknologi') as event_category,
		       poster_url, video_url, video_title, file_url, file_title, status 
		FROM affiliate_submissions 
		WHERE id = ?
	`, submissionID)
	if err != nil {
		fmt.Printf("Error loading submission %s: %v\n", submissionID, err)
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
		err := config.DB.Get(&officialOrgID, `SELECT id FROM organizations WHERE is_official = 1 LIMIT 1`)
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
			VALUES (?, ?, ?, ?, ?, 'DRAFT', ?)
		`, officialOrgID, submission.EventTitle, description, submission.EventCategory, submission.PosterURL, submission.ID)

		if err != nil {
			fmt.Printf("[APPROVE] Error creating event: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat event"})
			return
		}

		eventID, _ := eventResult.LastInsertId()

		// Create session
		sessionResult, err := config.DB.Exec(`
			INSERT INTO sessions (event_id, title, description, price, publish_status)
			VALUES (?, ?, ?, ?, 'DRAFT')
		`, eventID, submission.EventTitle, description, submission.EventPrice)

		if err != nil {
			fmt.Printf("[APPROVE] Error creating session: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat session"})
			return
		}

		sessionID, _ := sessionResult.LastInsertId()

		// ============================================
		// TRANSFER MATERIALS - FIX: Use video_url and file_url columns
		// ============================================

		// --- VIDEOS ---
		var videos []struct {
			Title string `db:"title"`
			URL   string `db:"url"`
		}
		config.DB.Select(&videos, `
			SELECT COALESCE(title, 'Video Materi') as title, url 
			FROM affiliate_submission_videos 
			WHERE submission_id = ?
		`, submissionID)

		fmt.Printf("[APPROVE] Found %d videos in affiliate_submission_videos\n", len(videos))

		// Fallback to legacy video_url if no videos in new table
		if len(videos) == 0 && submission.VideoURL != nil && *submission.VideoURL != "" {
			fmt.Printf("[APPROVE] Using legacy video_url: %s\n", *submission.VideoURL)
			title := "Video Materi"
			if submission.VideoTitle != nil && *submission.VideoTitle != "" {
				title = *submission.VideoTitle
			}
			videos = append(videos, struct {
				Title string `db:"title"`
				URL   string `db:"url"`
			}{Title: title, URL: *submission.VideoURL})
		}

		// Insert all videos to session_videos
		for i, video := range videos {
			// Use the original URL from Supabase directly
			_, insertErr := config.DB.Exec(`
				INSERT INTO session_videos (session_id, title, video_url, order_index)
				VALUES (?, ?, ?, ?)
			`, sessionID, video.Title, video.URL, i+1)
			if insertErr != nil {
				fmt.Printf("[APPROVE] Error inserting video %d: %v\n", i+1, insertErr)
			} else {
				fmt.Printf("[APPROVE] ✅ Video %d inserted: %s\n", i+1, video.URL)
			}
		}

		// --- FILES ---
		var files []struct {
			Title string `db:"title"`
			URL   string `db:"url"`
		}
		config.DB.Select(&files, `
			SELECT COALESCE(title, 'Modul Materi') as title, url 
			FROM affiliate_submission_files 
			WHERE submission_id = ?
		`, submissionID)

		fmt.Printf("[APPROVE] Found %d files in affiliate_submission_files\n", len(files))

		// Fallback to legacy file_url if no files in new table
		if len(files) == 0 && submission.FileURL != nil && *submission.FileURL != "" {
			fmt.Printf("[APPROVE] Using legacy file_url: %s\n", *submission.FileURL)
			title := "Modul Materi"
			if submission.FileTitle != nil && *submission.FileTitle != "" {
				title = *submission.FileTitle
			}
			files = append(files, struct {
				Title string `db:"title"`
				URL   string `db:"url"`
			}{Title: title, URL: *submission.FileURL})
		}

		// Insert all files to session_files
		for i, file := range files {
			// Use the original URL from Supabase directly
			_, insertErr := config.DB.Exec(`
				INSERT INTO session_files (session_id, title, file_url, order_index)
				VALUES (?, ?, ?, ?)
			`, sessionID, file.Title, file.URL, i+1)
			if insertErr != nil {
				fmt.Printf("[APPROVE] Error inserting file %d: %v\n", i+1, insertErr)
			} else {
				fmt.Printf("[APPROVE] ✅ File %d inserted: %s\n", i+1, file.URL)
			}
		}

		// Update submission status
		config.DB.Exec(`
			UPDATE affiliate_submissions 
			SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), review_note = ?
			WHERE id = ?
		`, adminID, input.Note, submissionID)

		// Add AFFILIATE role to user if not already has it
		if submission.UserID != nil {
			var hasRole int
			config.DB.Get(&hasRole, `
				SELECT COUNT(*) FROM user_roles ur
				JOIN roles r ON ur.role_id = r.id
				WHERE ur.user_id = ? AND r.name = 'AFFILIATE'
			`, *submission.UserID)

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
			`, *submission.UserID, fmt.Sprintf("Event '%s' telah disetujui dan masuk ke draft. Admin akan mempublikasikan segera.", submission.EventTitle))
		}

		fmt.Printf("[APPROVE] ✅ Created event=%d, session=%d with %d videos and %d files\n", eventID, sessionID, len(videos), len(files))

		c.JSON(http.StatusOK, gin.H{
			"message":  "Event berhasil disetujui dan masuk ke draft",
			"event_id": eventID,
		})

	} else {
		// Reject - just update status
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
		WHERE o.is_official = 1
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
	// First get the current org ID
	var orgID int64
	err := config.DB.Get(&orgID, `SELECT id FROM organizations WHERE is_official = 1 LIMIT 1`)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organisasi Official tidak ditemukan"})
		return
	}

	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Category    string `json:"category"`
		Email       string `json:"email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	// If name is empty, keep the old name
	if input.Name == "" {
		input.Name = "Official"
	}

	_, err = config.DB.Exec(`
		UPDATE organizations 
		SET name = ?, description = ?, category = ?, email = ?
		WHERE id = ?
	`, input.Name, input.Description, input.Category, input.Email, orgID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Organisasi berhasil diupdate"})
}

// UploadOfficialOrgLogo - Upload logo for Official org
func UploadOfficialOrgLogo(c *gin.Context) {
	fileHeader, err := c.FormFile("logo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File tidak ditemukan"})
		return
	}

	filename := fmt.Sprintf("official_%d%s", time.Now().UnixNano(), filepath.Ext(fileHeader.Filename))
	storagePath := "organization/" + filename

	publicURL, err := utils.UploadFileHeaderToSupabase(storagePath, fileHeader)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal upload file"})
		return
	}

	config.DB.Exec(`UPDATE organizations SET logo_url = ? WHERE is_official = 1`, publicURL)

	c.JSON(http.StatusOK, gin.H{"message": "Logo berhasil diupload", "logo_url": publicURL})
}

// GetOfficialOrgEvents - Get all events under Official organization
func GetOfficialOrgEvents(c *gin.Context) {
	// Get Official org ID first
	var officialOrgID int64
	err := config.DB.Get(&officialOrgID, `SELECT id FROM organizations WHERE is_official = 1 LIMIT 1`)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organisasi Official belum dibuat"})
		return
	}

	var events []struct {
		ID                    int64   `db:"id" json:"id"`
		Title                 string  `db:"title" json:"title"`
		Description           *string `db:"description" json:"description"`
		Category              *string `db:"category" json:"category"`
		ThumbnailURL          *string `db:"thumbnail_url" json:"thumbnail_url"`
		PublishStatus         string  `db:"publish_status" json:"publish_status"`
		AffiliateSubmissionID *int64  `db:"affiliate_submission_id" json:"affiliate_submission_id"`
		SessionsCount         int     `db:"sessions_count" json:"sessions_count"`
		TotalSales            int     `db:"total_sales" json:"total_sales"`
		CreatedAt             string  `db:"created_at" json:"created_at"`
	}

	err = config.DB.Select(&events, `
		SELECT 
			e.id, e.title, e.description, e.category, e.thumbnail_url, 
			e.publish_status, e.affiliate_submission_id, e.created_at,
			(SELECT COUNT(*) FROM sessions WHERE event_id = e.id) as sessions_count,
			COALESCE((SELECT COUNT(*) FROM affiliate_ledgers al 
			          JOIN affiliate_submissions asub ON al.affiliate_submission_id = asub.id
			          JOIN events ev ON ev.affiliate_submission_id = asub.id
			          WHERE ev.id = e.id), 0) as total_sales
		FROM events e
		WHERE e.organization_id = ?
		ORDER BY e.created_at DESC
	`, officialOrgID)

	if err != nil {
		fmt.Printf("Error fetching official events: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"events": events, "organization_id": officialOrgID})
}

// GetOfficialOrgEventDetail - Get single event detail with sessions
func GetOfficialOrgEventDetail(c *gin.Context) {
	eventID := c.Param("eventId")

	var event struct {
		ID                    int64   `db:"id" json:"id"`
		Title                 string  `db:"title" json:"title"`
		Description           *string `db:"description" json:"description"`
		Category              *string `db:"category" json:"category"`
		ThumbnailURL          *string `db:"thumbnail_url" json:"thumbnail_url"`
		PublishStatus         string  `db:"publish_status" json:"publish_status"`
		AffiliateSubmissionID *int64  `db:"affiliate_submission_id" json:"affiliate_submission_id"`
		CreatedAt             string  `db:"created_at" json:"created_at"`
	}

	err := config.DB.Get(&event, `
		SELECT id, title, description, category, thumbnail_url, publish_status, 
		       affiliate_submission_id, created_at
		FROM events 
		WHERE id = ?
	`, eventID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event tidak ditemukan"})
		return
	}

	// Get sessions
	var sessions []struct {
		ID            int64   `db:"id" json:"id"`
		Title         string  `db:"title" json:"title"`
		Description   *string `db:"description" json:"description"`
		Price         int64   `db:"price" json:"price"`
		PublishStatus string  `db:"publish_status" json:"publish_status"`
		VideosCount   int     `db:"videos_count" json:"videos_count"`
		FilesCount    int     `db:"files_count" json:"files_count"`
	}
	config.DB.Select(&sessions, `
		SELECT s.id, s.title, s.description, s.price, s.publish_status,
		       (SELECT COUNT(*) FROM session_videos WHERE session_id = s.id) as videos_count,
		       (SELECT COUNT(*) FROM session_files WHERE session_id = s.id) as files_count
		FROM sessions s
		WHERE s.event_id = ?
		ORDER BY s.id ASC
	`, eventID)

	c.JSON(http.StatusOK, gin.H{"event": event, "sessions": sessions})
}

// DeleteOfficialOrgEvent - Delete event from Official org
func DeleteOfficialOrgEvent(c *gin.Context) {
	eventID := c.Param("eventId")

	// Delete sessions first
	var sessionIDs []int64
	config.DB.Select(&sessionIDs, `SELECT id FROM sessions WHERE event_id = ?`, eventID)

	for _, sessionID := range sessionIDs {
		config.DB.Exec(`DELETE FROM session_videos WHERE session_id = ?`, sessionID)
		config.DB.Exec(`DELETE FROM session_files WHERE session_id = ?`, sessionID)
	}
	config.DB.Exec(`DELETE FROM sessions WHERE event_id = ?`, eventID)

	// Delete the event
	_, err := config.DB.Exec(`DELETE FROM events WHERE id = ?`, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event berhasil dihapus"})
}

// ========================================================
// OFFICIAL ORG CRUD - EDIT FUNCTIONALITY
// ========================================================

// UpdateOfficialOrgEvent - Update event title, description, category
func UpdateOfficialOrgEvent(c *gin.Context) {
	eventID := c.Param("eventId")

	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Category    string `json:"category"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	_, err := config.DB.Exec(`
		UPDATE events 
		SET title = ?, description = ?, category = ?
		WHERE id = ?
	`, input.Title, input.Description, input.Category, eventID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update event"})
		return
	}

	// Also update session title if event title changed
	config.DB.Exec(`UPDATE sessions SET title = ? WHERE event_id = ?`, input.Title, eventID)

	c.JSON(http.StatusOK, gin.H{"message": "Event berhasil diupdate"})
}

// UploadOfficialOrgEventThumbnail - Upload/replace event thumbnail
func UploadOfficialOrgEventThumbnail(c *gin.Context) {
	eventID := c.Param("eventId")

	fileHeader, err := c.FormFile("thumbnail")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File thumbnail diperlukan"})
		return
	}

	filename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), eventID, filepath.Ext(fileHeader.Filename))
	storagePath := "events/" + filename

	publicURL, err := utils.UploadFileHeaderToSupabase(storagePath, fileHeader)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal upload thumbnail"})
		return
	}

	_, err = config.DB.Exec(`UPDATE events SET thumbnail_url = ? WHERE id = ?`, publicURL, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update thumbnail"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Thumbnail berhasil diupdate", "thumbnail_url": publicURL})
}

// UpdateOfficialOrgSession - Update session title, description, price
func UpdateOfficialOrgSession(c *gin.Context) {
	sessionID := c.Param("sessionId")

	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Price       int64  `json:"price"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	_, err := config.DB.Exec(`
		UPDATE sessions 
		SET title = ?, description = ?, price = ?
		WHERE id = ?
	`, input.Title, input.Description, input.Price, sessionID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session berhasil diupdate"})
}

// UpdateOfficialOrgVideo - Update video title
func UpdateOfficialOrgVideo(c *gin.Context) {
	videoID := c.Param("videoId")

	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	_, err := config.DB.Exec(`
		UPDATE session_videos 
		SET title = ?, description = ?
		WHERE id = ?
	`, input.Title, input.Description, videoID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update video"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Video berhasil diupdate"})
}

// DeleteOfficialOrgVideo - Delete a video
func DeleteOfficialOrgVideo(c *gin.Context) {
	videoID := c.Param("videoId")

	_, err := config.DB.Exec(`DELETE FROM session_videos WHERE id = ?`, videoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus video"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Video berhasil dihapus"})
}

// UpdateOfficialOrgFile - Update file title
func UpdateOfficialOrgFile(c *gin.Context) {
	fileID := c.Param("fileId")

	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	_, err := config.DB.Exec(`
		UPDATE session_files 
		SET title = ?, description = ?
		WHERE id = ?
	`, input.Title, input.Description, fileID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File berhasil diupdate"})
}

// DeleteOfficialOrgFile - Delete a file
func DeleteOfficialOrgFile(c *gin.Context) {
	fileID := c.Param("fileId")

	_, err := config.DB.Exec(`DELETE FROM session_files WHERE id = ?`, fileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File berhasil dihapus"})
}

// ========================================================
// OFFICIAL ORGANIZATION - CREATE EVENT & SESSION
// ========================================================

// CreateOfficialOrgEvent - Create new event under Official org
func CreateOfficialOrgEvent(c *gin.Context) {
	var input struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		Category    string `json:"category"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Judul wajib diisi"})
		return
	}

	// Get Official org ID
	var officialOrgID int64
	err := config.DB.Get(&officialOrgID, `SELECT id FROM organizations WHERE is_official = 1 LIMIT 1`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Organisasi Official belum dibuat"})
		return
	}

	// Default category
	if input.Category == "" {
		input.Category = "Teknologi"
	}

	result, err := config.DB.Exec(`
		INSERT INTO events (organization_id, title, description, category, publish_status, created_at, updated_at)
		VALUES (?, ?, ?, ?, 'DRAFT', NOW(), NOW())
	`, officialOrgID, input.Title, input.Description, input.Category)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat event"})
		return
	}

	eventID, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"message": "Event berhasil dibuat", "event_id": eventID})
}

// CreateOfficialOrgSession - Create new session under Official org event
func CreateOfficialOrgSession(c *gin.Context) {
	eventID := c.Param("eventId")

	var input struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		Price       int64  `json:"price"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Judul wajib diisi"})
		return
	}

	// Get max order index
	var maxOrder int
	config.DB.Get(&maxOrder, "SELECT COALESCE(MAX(order_index), 0) FROM sessions WHERE event_id = ?", eventID)

	result, err := config.DB.Exec(`
		INSERT INTO sessions (event_id, title, description, price, order_index, publish_status, created_at)
		VALUES (?, ?, ?, ?, ?, 'DRAFT', NOW())
	`, eventID, input.Title, input.Description, input.Price, maxOrder+1)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat session"})
		return
	}

	sessionID, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"message": "Session berhasil dibuat", "session_id": sessionID})
}

// DeleteOfficialOrgSession - Delete a session
func DeleteOfficialOrgSession(c *gin.Context) {
	sessionID := c.Param("sessionId")

	// Delete videos and files first
	config.DB.Exec(`DELETE FROM session_videos WHERE session_id = ?`, sessionID)
	config.DB.Exec(`DELETE FROM session_files WHERE session_id = ?`, sessionID)
	config.DB.Exec(`DELETE FROM purchases WHERE session_id = ?`, sessionID)

	_, err := config.DB.Exec(`DELETE FROM sessions WHERE id = ?`, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session berhasil dihapus"})
}

// ========================================================
// OFFICIAL ORGANIZATION - PUBLISH/UNPUBLISH/SCHEDULE
// ========================================================

// PublishOfficialOrgEvent - Publish event
func PublishOfficialOrgEvent(c *gin.Context) {
	eventID := c.Param("eventId")

	_, err := config.DB.Exec(`UPDATE events SET publish_status = 'PUBLISHED', publish_at = NULL WHERE id = ?`, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal publish event"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event berhasil dipublish", "status": "PUBLISHED"})
}

// UnpublishOfficialOrgEvent - Unpublish event to draft
func UnpublishOfficialOrgEvent(c *gin.Context) {
	eventID := c.Param("eventId")

	_, err := config.DB.Exec(`UPDATE events SET publish_status = 'DRAFT', publish_at = NULL WHERE id = ?`, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal unpublish event"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event berhasil di-draft", "status": "DRAFT"})
}

// ScheduleOfficialOrgEvent - Schedule event publish
func ScheduleOfficialOrgEvent(c *gin.Context) {
	eventID := c.Param("eventId")

	var input struct {
		PublishAt string `json:"publish_at" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal publish wajib diisi"})
		return
	}

	// Parse datetime
	parsedTime, err := time.Parse("2006-01-02T15:04", input.PublishAt)
	if err != nil {
		parsedTime, err = time.Parse(time.RFC3339, input.PublishAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal tidak valid"})
			return
		}
	}

	sqlTimeStr := parsedTime.Format("2006-01-02 15:04:05")
	_, err = config.DB.Exec(`UPDATE events SET publish_status = 'SCHEDULED', publish_at = ? WHERE id = ?`, sqlTimeStr, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal schedule event"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event berhasil dijadwalkan", "status": "SCHEDULED", "publish_at": input.PublishAt})
}

// PublishOfficialOrgSession - Publish session
func PublishOfficialOrgSession(c *gin.Context) {
	sessionID := c.Param("sessionId")

	_, err := config.DB.Exec(`UPDATE sessions SET publish_status = 'PUBLISHED', publish_at = NULL WHERE id = ?`, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal publish session"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Session berhasil dipublish", "status": "PUBLISHED"})
}

// UnpublishOfficialOrgSession - Unpublish session to draft
func UnpublishOfficialOrgSession(c *gin.Context) {
	sessionID := c.Param("sessionId")

	_, err := config.DB.Exec(`UPDATE sessions SET publish_status = 'DRAFT', publish_at = NULL WHERE id = ?`, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal unpublish session"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Session berhasil di-draft", "status": "DRAFT"})
}

// ScheduleOfficialOrgSession - Schedule session publish
func ScheduleOfficialOrgSession(c *gin.Context) {
	sessionID := c.Param("sessionId")

	var input struct {
		PublishAt string `json:"publish_at" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal publish wajib diisi"})
		return
	}

	parsedTime, err := time.Parse("2006-01-02T15:04", input.PublishAt)
	if err != nil {
		parsedTime, err = time.Parse(time.RFC3339, input.PublishAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal tidak valid"})
			return
		}
	}

	sqlTimeStr := parsedTime.Format("2006-01-02 15:04:05")
	_, err = config.DB.Exec(`UPDATE sessions SET publish_status = 'SCHEDULED', publish_at = ? WHERE id = ?`, sqlTimeStr, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal schedule session"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Session berhasil dijadwalkan", "status": "SCHEDULED", "publish_at": input.PublishAt})
}

// ========================================================
// OFFICIAL ORGANIZATION - UPLOAD VIDEO & FILE
// ========================================================

// UploadOfficialOrgSessionVideo - Upload video to session
func UploadOfficialOrgSessionVideo(c *gin.Context) {
	sessionID := c.Param("sessionId")

	title := c.PostForm("title")
	if title == "" {
		title = "Video Materi"
	}
	description := c.PostForm("description")

	fileHeader, err := c.FormFile("video")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File video wajib diupload"})
		return
	}

	filename := fmt.Sprintf("official_%d_%s%s", time.Now().UnixNano(), sessionID, filepath.Ext(fileHeader.Filename))
	storagePath := "videos/" + filename

	publicURL, err := utils.UploadFileHeaderToSupabase(storagePath, fileHeader)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal upload video"})
		return
	}

	result, err := config.DB.Exec(`
		INSERT INTO session_videos (session_id, title, description, video_url)
		VALUES (?, ?, ?, ?)
	`, sessionID, title, description, publicURL)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan ke database"})
		return
	}

	videoID, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"message": "Video berhasil diupload", "video_id": videoID, "video_url": publicURL})
}

// UploadOfficialOrgSessionFile - Upload file/module to session
func UploadOfficialOrgSessionFile(c *gin.Context) {
	sessionID := c.Param("sessionId")

	title := c.PostForm("title")
	if title == "" {
		title = "Modul Materi"
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File wajib diupload"})
		return
	}

	filename := fmt.Sprintf("official_%d_%s%s", time.Now().UnixNano(), sessionID, filepath.Ext(fileHeader.Filename))
	storagePath := "files/" + filename

	publicURL, err := utils.UploadFileHeaderToSupabase(storagePath, fileHeader)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal upload file"})
		return
	}

	result, err := config.DB.Exec(`
		INSERT INTO session_files (session_id, title, file_url)
		VALUES (?, ?, ?)
	`, sessionID, title, publicURL)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan ke database"})
		return
	}

	fileID, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"message": "File berhasil diupload", "file_id": fileID, "file_url": publicURL})
}

// ========================================================
// OFFICIAL ORGANIZATION - QUIZ & CERTIFICATE
// ========================================================

// GetOfficialOrgCertificateSettings - Get certificate settings for Official org event
func GetOfficialOrgCertificateSettings(c *gin.Context) {
	eventID := c.Param("eventId")

	var settings struct {
		ID              int64   `db:"id" json:"id"`
		EventID         int64   `db:"event_id" json:"event_id"`
		IsEnabled       bool    `db:"is_enabled" json:"is_enabled"`
		MinScorePercent int     `db:"min_score_percent" json:"min_score_percent"`
		CertTitle       *string `db:"certificate_title" json:"certificate_title"`
	}

	err := config.DB.Get(&settings, `
		SELECT id, event_id, is_enabled, min_score_percent, certificate_title
		FROM event_certificates WHERE event_id = ?
	`, eventID)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"settings": gin.H{
				"event_id":          eventID,
				"is_enabled":        false,
				"min_score_percent": 80,
				"certificate_title": nil,
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"settings": settings})
}

// UpdateOfficialOrgCertificateSettings - Update certificate settings
func UpdateOfficialOrgCertificateSettings(c *gin.Context) {
	eventID := c.Param("eventId")

	var input struct {
		IsEnabled       bool    `json:"is_enabled"`
		MinScorePercent int     `json:"min_score_percent"`
		CertTitle       *string `json:"certificate_title"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	if input.MinScorePercent < 1 || input.MinScorePercent > 100 {
		input.MinScorePercent = 80
	}

	_, err := config.DB.Exec(`
		INSERT INTO event_certificates (event_id, is_enabled, min_score_percent, certificate_title)
		VALUES (?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), 
		                        min_score_percent = VALUES(min_score_percent),
		                        certificate_title = VALUES(certificate_title)
	`, eventID, input.IsEnabled, input.MinScorePercent, input.CertTitle)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pengaturan sertifikat berhasil disimpan"})
}

// GetOfficialOrgSessionQuiz - Get quiz for Official org session
func GetOfficialOrgSessionQuiz(c *gin.Context) {
	sessionID := c.Param("sessionId")

	var quiz struct {
		ID        int64  `db:"id" json:"id"`
		SessionID int64  `db:"session_id" json:"session_id"`
		Title     string `db:"title" json:"title"`
		IsEnabled bool   `db:"is_enabled" json:"is_enabled"`
	}

	err := config.DB.Get(&quiz, `SELECT id, session_id, title, is_enabled FROM session_quizzes WHERE session_id = ?`, sessionID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"quiz": nil, "questions": []interface{}{}})
		return
	}

	var questions []struct {
		ID            int64   `db:"id" json:"id"`
		QuestionText  string  `db:"question_text" json:"question_text"`
		OptionA       string  `db:"option_a" json:"option_a"`
		OptionB       string  `db:"option_b" json:"option_b"`
		OptionC       *string `db:"option_c" json:"option_c"`
		OptionD       *string `db:"option_d" json:"option_d"`
		CorrectOption string  `db:"correct_option" json:"correct_option"`
		OrderIndex    int     `db:"order_index" json:"order_index"`
	}
	config.DB.Select(&questions, `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, order_index FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index`, quiz.ID)

	c.JSON(http.StatusOK, gin.H{"quiz": quiz, "questions": questions})
}

// SaveOfficialOrgSessionQuiz - Save quiz for Official org session
func SaveOfficialOrgSessionQuiz(c *gin.Context) {
	sessionID := c.Param("sessionId")

	var input struct {
		Title     string `json:"title"`
		IsEnabled bool   `json:"is_enabled"`
		Questions []struct {
			QuestionText  string  `json:"question_text"`
			OptionA       string  `json:"option_a"`
			OptionB       string  `json:"option_b"`
			OptionC       *string `json:"option_c"`
			OptionD       *string `json:"option_d"`
			CorrectOption string  `json:"correct_option"`
		} `json:"questions"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	if len(input.Questions) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maksimal 10 pertanyaan"})
		return
	}

	// Upsert quiz
	result, err := config.DB.Exec(`
		INSERT INTO session_quizzes (session_id, title, is_enabled)
		VALUES (?, ?, ?)
		ON DUPLICATE KEY UPDATE title = VALUES(title), is_enabled = VALUES(is_enabled)
	`, sessionID, input.Title, input.IsEnabled)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan kuis"})
		return
	}

	var quizID int64
	config.DB.Get(&quizID, "SELECT id FROM session_quizzes WHERE session_id = ?", sessionID)
	if quizID == 0 {
		quizID, _ = result.LastInsertId()
	}

	// Delete old questions and insert new
	config.DB.Exec("DELETE FROM quiz_questions WHERE quiz_id = ?", quizID)

	for i, q := range input.Questions {
		config.DB.Exec(`
			INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, order_index)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`, quizID, q.QuestionText, q.OptionA, q.OptionB, q.OptionC, q.OptionD, q.CorrectOption, i+1)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kuis berhasil disimpan", "quiz_id": quizID})
}

// DeleteOfficialOrgSessionQuiz - Delete quiz
func DeleteOfficialOrgSessionQuiz(c *gin.Context) {
	sessionID := c.Param("sessionId")

	config.DB.Exec("DELETE FROM session_quizzes WHERE session_id = ?", sessionID)
	c.JSON(http.StatusOK, gin.H{"message": "Kuis berhasil dihapus"})
}
