package controllers

import (
	"BACKEND/config"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ApplyAffiliate - User applies to become an affiliate
func ApplyAffiliate(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var input struct {
		Motivation string `json:"motivation"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	// Check if user already has AFFILIATE role
	var hasRole int
	config.DB.Get(&hasRole, `
		SELECT COUNT(*) FROM user_roles ur
		JOIN roles r ON ur.role_id = r.id
		WHERE ur.user_id = ? AND r.name = 'AFFILIATE'
	`, userID)
	if hasRole > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah menjadi affiliate"})
		return
	}

	// Check if already applied
	var existingApp int
	config.DB.Get(&existingApp, `SELECT COUNT(*) FROM affiliate_applications WHERE user_id = ?`, userID)
	if existingApp > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah mengajukan permohonan affiliate"})
		return
	}

	// Insert application
	_, err := config.DB.Exec(`
		INSERT INTO affiliate_applications (user_id, motivation, status)
		VALUES (?, ?, 'PENDING')
	`, userID, input.Motivation)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan permohonan"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Permohonan affiliate berhasil dikirim"})
}

// GetMyAffiliateApplication - Check user's affiliate application status
func GetMyAffiliateApplication(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var app struct {
		ID         int64   `db:"id" json:"id"`
		Status     string  `db:"status" json:"status"`
		Motivation *string `db:"motivation" json:"motivation"`
		ReviewNote *string `db:"review_note" json:"review_note"`
		CreatedAt  string  `db:"created_at" json:"created_at"`
	}

	err := config.DB.Get(&app, `
		SELECT id, status, motivation, review_note, created_at
		FROM affiliate_applications WHERE user_id = ?
	`, userID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Belum ada permohonan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"application": app})
}

// GetAffiliateDashboard - Dashboard stats for affiliate
func GetAffiliateDashboard(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var stats struct {
		TotalEvents     int     `db:"total_events" json:"total_events"`
		ApprovedEvents  int     `db:"approved_events" json:"approved_events"`
		PendingEvents   int     `db:"pending_events" json:"pending_events"`
		TotalEarnings   float64 `db:"total_earnings" json:"total_earnings"`
		PendingEarnings float64 `db:"pending_earnings" json:"pending_earnings"`
		TotalSales      int     `db:"total_sales" json:"total_sales"`
	}

	// Get submission stats
	config.DB.Get(&stats.TotalEvents, `
		SELECT COUNT(*) FROM affiliate_submissions WHERE user_id = ?
	`, userID)
	config.DB.Get(&stats.ApprovedEvents, `
		SELECT COUNT(*) FROM affiliate_submissions WHERE user_id = ? AND status = 'APPROVED'
	`, userID)
	config.DB.Get(&stats.PendingEvents, `
		SELECT COUNT(*) FROM affiliate_submissions WHERE user_id = ? AND status = 'PENDING'
	`, userID)

	// Get earnings stats
	config.DB.Get(&stats.TotalEarnings, `
		SELECT COALESCE(SUM(al.affiliate_amount), 0)
		FROM affiliate_ledgers al
		JOIN affiliate_submissions asub ON al.affiliate_submission_id = asub.id
		WHERE asub.user_id = ? AND al.is_paid_out = 1
	`, userID)
	config.DB.Get(&stats.PendingEarnings, `
		SELECT COALESCE(SUM(al.affiliate_amount), 0)
		FROM affiliate_ledgers al
		JOIN affiliate_submissions asub ON al.affiliate_submission_id = asub.id
		WHERE asub.user_id = ? AND al.is_paid_out = 0
	`, userID)
	config.DB.Get(&stats.TotalSales, `
		SELECT COUNT(*)
		FROM affiliate_ledgers al
		JOIN affiliate_submissions asub ON al.affiliate_submission_id = asub.id
		WHERE asub.user_id = ?
	`, userID)

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// GetAffiliateEvents - List affiliate's submitted events with earnings
func GetAffiliateEvents(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var events []struct {
		ID              int64   `db:"id" json:"id"`
		EventTitle      string  `db:"event_title" json:"event_title"`
		EventPrice      int64   `db:"event_price" json:"event_price"`
		Status          string  `db:"status" json:"status"`
		PosterURL       *string `db:"poster_url" json:"poster_url"`
		CreatedAt       string  `db:"created_at" json:"created_at"`
		TotalSales      int     `db:"total_sales" json:"total_sales"`
		TotalEarnings   float64 `db:"total_earnings" json:"total_earnings"`
		PendingEarnings float64 `db:"pending_earnings" json:"pending_earnings"`
	}

	err := config.DB.Select(&events, `
		SELECT 
			asub.id,
			asub.event_title,
			asub.event_price,
			asub.status,
			asub.poster_url,
			asub.created_at,
			COALESCE((SELECT COUNT(*) FROM affiliate_ledgers al WHERE al.affiliate_submission_id = asub.id), 0) as total_sales,
			COALESCE((SELECT SUM(al.affiliate_amount) FROM affiliate_ledgers al WHERE al.affiliate_submission_id = asub.id AND al.is_paid_out = 1), 0) as total_earnings,
			COALESCE((SELECT SUM(al.affiliate_amount) FROM affiliate_ledgers al WHERE al.affiliate_submission_id = asub.id AND al.is_paid_out = 0), 0) as pending_earnings
		FROM affiliate_submissions asub
		WHERE asub.user_id = ?
		ORDER BY asub.created_at DESC
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}

// SubmitAffiliateEvent - Affiliate submits new event for review
// FLOW: Insert ke affiliate_submissions dulu, admin yang create event saat approve
func SubmitAffiliateEvent(c *gin.Context) {
	userID := c.GetInt64("user_id")
	fmt.Printf("[SubmitAffiliate] ========== START SUBMIT ==========\n")
	fmt.Printf("[SubmitAffiliate] User ID: %d\n", userID)

	// Parse form data
	eventTitle := c.PostForm("event_title")
	eventDescription := c.PostForm("event_description")
	eventPriceStr := c.PostForm("event_price")
	eventCategory := c.PostForm("event_category")
	if eventCategory == "" {
		eventCategory = "Teknologi"
	}

	fmt.Printf("[SubmitAffiliate] Event: %s, Price: %s, Category: %s\n", eventTitle, eventPriceStr, eventCategory)

	if eventTitle == "" {
		fmt.Printf("[SubmitAffiliate] ERROR: event_title is empty\n")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Judul event wajib diisi"})
		return
	}

	eventPrice, _ := strconv.ParseInt(eventPriceStr, 10, 64)

	// Handle poster upload
	var posterURL string
	posterFile, err := c.FormFile("poster")
	if err == nil {
		os.MkdirAll("uploads/posters", os.ModePerm)
		posterFilename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], filepath.Ext(posterFile.Filename))
		posterPath := filepath.Join("uploads/posters", posterFilename)
		if err := c.SaveUploadedFile(posterFile, posterPath); err == nil {
			posterURL = posterPath
		}
	}

	// Handle multiple video uploads (max 3)
	type uploadedMaterial struct {
		Title       string
		Description string
		URL         string
	}
	var uploadedVideos []uploadedMaterial
	form, _ := c.MultipartForm()
	os.MkdirAll("uploads/affiliate_videos", os.ModePerm)
	os.MkdirAll("uploads/affiliate_files", os.ModePerm)

	if form != nil {
		videoFiles := form.File["videos"]
		videoTitles := c.PostFormArray("video_titles")
		videoDescriptions := c.PostFormArray("video_descriptions")

		for i, videoFile := range videoFiles {
			if i >= 3 {
				break // Max 3 videos
			}
			videoFilename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], filepath.Ext(videoFile.Filename))
			videoPath := filepath.Join("uploads/affiliate_videos", videoFilename)
			if err := c.SaveUploadedFile(videoFile, videoPath); err == nil {
				title := ""
				if i < len(videoTitles) {
					title = videoTitles[i]
				}
				if title == "" {
					title = fmt.Sprintf("Video %d", i+1)
				}
				description := ""
				if i < len(videoDescriptions) {
					description = videoDescriptions[i]
				}
				uploadedVideos = append(uploadedVideos, uploadedMaterial{Title: title, Description: description, URL: videoPath})
			}
		}
	}

	// Handle multiple file uploads (max 3)
	var uploadedFiles []uploadedMaterial
	if form != nil {
		moduleFiles := form.File["files"]
		fileTitles := c.PostFormArray("file_titles")
		fileDescriptions := c.PostFormArray("file_descriptions")

		for i, moduleFile := range moduleFiles {
			if i >= 3 {
				break // Max 3 files
			}
			moduleFilename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], filepath.Ext(moduleFile.Filename))
			modulePath := filepath.Join("uploads/affiliate_files", moduleFilename)
			if err := c.SaveUploadedFile(moduleFile, modulePath); err == nil {
				title := ""
				if i < len(fileTitles) {
					title = fileTitles[i]
				}
				if title == "" {
					title = fmt.Sprintf("Modul %d", i+1)
				}
				description := ""
				if i < len(fileDescriptions) {
					description = fileDescriptions[i]
				}
				uploadedFiles = append(uploadedFiles, uploadedMaterial{Title: title, Description: description, URL: modulePath})
			}
		}
	}

	// Validate: at least one material required
	if len(uploadedVideos) == 0 && len(uploadedFiles) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Upload minimal 1 materi (video atau file)"})
		return
	}

	// Get additional form fields
	phone := c.PostForm("phone")
	bankName := c.PostForm("bank_name")
	bankAccountNumber := c.PostForm("bank_account_number")
	bankAccountHolder := c.PostForm("bank_account_holder")

	// Validate required contact and bank info
	if phone == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No. Telepon wajib diisi"})
		return
	}
	if bankName == "" || bankAccountNumber == "" || bankAccountHolder == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Informasi rekening bank wajib diisi lengkap"})
		return
	}

	// Get user info
	var user struct {
		Name  string `db:"name"`
		Email string `db:"email"`
	}
	config.DB.Get(&user, `SELECT name, email FROM users WHERE id = ?`, userID)

	// First video/file for backward compatibility with main table
	var firstVideoURL, firstVideoTitle, firstFileURL, firstFileTitle string
	if len(uploadedVideos) > 0 {
		firstVideoURL = uploadedVideos[0].URL
		firstVideoTitle = uploadedVideos[0].Title
	}
	if len(uploadedFiles) > 0 {
		firstFileURL = uploadedFiles[0].URL
		firstFileTitle = uploadedFiles[0].Title
	}

	// ============================================
	// INSERT INTO affiliate_submissions (PENDING)
	// ============================================
	result, err := config.DB.Exec(`
		INSERT INTO affiliate_submissions 
		(user_id, full_name, email, phone, event_title, event_description, event_price, event_category,
		 poster_url, video_url, video_title, file_url, file_title, 
		 bank_name, bank_account_number, bank_account_holder, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
	`, userID, user.Name, user.Email, phone, eventTitle, eventDescription, eventPrice, eventCategory,
		posterURL, firstVideoURL, firstVideoTitle, firstFileURL, firstFileTitle,
		bankName, bankAccountNumber, bankAccountHolder)

	if err != nil {
		fmt.Printf("[SubmitAffiliate] Error creating submission: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan pengajuan"})
		return
	}

	submissionID, _ := result.LastInsertId()

	// Insert all videos into affiliate_submission_videos table
	for _, video := range uploadedVideos {
		_, err := config.DB.Exec(`
			INSERT INTO affiliate_submission_videos (submission_id, title, url)
			VALUES (?, ?, ?)
		`, submissionID, video.Title, video.URL)
		if err != nil {
			fmt.Printf("[SubmitAffiliate] Error inserting video: %v\n", err)
		}
	}

	// Insert all files into affiliate_submission_files table
	for _, file := range uploadedFiles {
		_, err := config.DB.Exec(`
			INSERT INTO affiliate_submission_files (submission_id, title, url)
			VALUES (?, ?, ?)
		`, submissionID, file.Title, file.URL)
		if err != nil {
			fmt.Printf("[SubmitAffiliate] Error inserting file: %v\n", err)
		}
	}

	fmt.Printf("[SubmitAffiliate] ✅ Created submission=%d with %d videos and %d files\n",
		submissionID, len(uploadedVideos), len(uploadedFiles))

	c.JSON(http.StatusCreated, gin.H{
		"message":       "Event berhasil diajukan untuk review",
		"submission_id": submissionID,
	})
}

// GetAffiliateSubmissionDetail - Get detail of a specific submission
func GetAffiliateSubmissionDetail(c *gin.Context) {
	userID := c.GetInt64("user_id")
	submissionID := c.Param("id")

	var submission struct {
		ID               int64   `db:"id" json:"id"`
		EventTitle       string  `db:"event_title" json:"event_title"`
		EventDescription *string `db:"event_description" json:"event_description"`
		EventPrice       int64   `db:"event_price" json:"event_price"`
		Status           string  `db:"status" json:"status"`
		PosterURL        *string `db:"poster_url" json:"poster_url"`
		VideoURL         *string `db:"video_url" json:"video_url"`
		VideoTitle       *string `db:"video_title" json:"video_title"`
		FileURL          *string `db:"file_url" json:"file_url"`
		FileTitle        *string `db:"file_title" json:"file_title"`
		ReviewNote       *string `db:"review_note" json:"review_note"`
		CreatedAt        string  `db:"created_at" json:"created_at"`
	}

	err := config.DB.Get(&submission, `
		SELECT id, event_title, event_description, event_price, status,
		       poster_url, video_url, video_title, file_url, file_title,
		       review_note, created_at
		FROM affiliate_submissions 
		WHERE id = ? AND user_id = ?
	`, submissionID, userID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengajuan tidak ditemukan"})
		return
	}

	// Get sales data
	var sales []struct {
		OrderID           string  `db:"order_id" json:"order_id"`
		TransactionAmount float64 `db:"transaction_amount" json:"transaction_amount"`
		AffiliateAmount   float64 `db:"affiliate_amount" json:"affiliate_amount"`
		IsPaidOut         bool    `db:"is_paid_out" json:"is_paid_out"`
		CreatedAt         string  `db:"created_at" json:"created_at"`
	}
	config.DB.Select(&sales, `
		SELECT order_id, transaction_amount, affiliate_amount, is_paid_out, created_at
		FROM affiliate_ledgers
		WHERE affiliate_submission_id = ?
		ORDER BY created_at DESC
	`, submissionID)

	c.JSON(http.StatusOK, gin.H{
		"submission": submission,
		"sales":      sales,
	})
}
