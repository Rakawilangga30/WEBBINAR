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

// SubmitAffiliateEvent - Affiliate submits new event with materials
func SubmitAffiliateEvent(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Parse form data
	eventTitle := c.PostForm("event_title")
	eventDescription := c.PostForm("event_description")
	eventPriceStr := c.PostForm("event_price")
	videoTitle := c.PostForm("video_title")
	fileTitle := c.PostForm("file_title")

	if eventTitle == "" {
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

	// Handle video upload
	var videoURL string
	videoFile, err := c.FormFile("video")
	if err == nil {
		os.MkdirAll("uploads/affiliate_videos", os.ModePerm)
		videoFilename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], filepath.Ext(videoFile.Filename))
		videoPath := filepath.Join("uploads/affiliate_videos", videoFilename)
		if err := c.SaveUploadedFile(videoFile, videoPath); err == nil {
			videoURL = videoPath
		}
	}

	// Handle file/module upload
	var fileURL string
	moduleFile, err := c.FormFile("file")
	if err == nil {
		os.MkdirAll("uploads/affiliate_files", os.ModePerm)
		moduleFilename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], filepath.Ext(moduleFile.Filename))
		modulePath := filepath.Join("uploads/affiliate_files", moduleFilename)
		if err := c.SaveUploadedFile(moduleFile, modulePath); err == nil {
			fileURL = modulePath
		}
	}

	// Validate: at least one material required
	if videoURL == "" && fileURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Upload minimal 1 materi (video atau file)"})
		return
	}

	// Get user info for full_name and email
	var user struct {
		Name  string `db:"name"`
		Email string `db:"email"`
	}
	config.DB.Get(&user, `SELECT name, email FROM users WHERE id = ?`, userID)

	// Insert submission
	result, err := config.DB.Exec(`
		INSERT INTO affiliate_submissions 
		(user_id, full_name, email, event_title, event_description, event_price, 
		 poster_url, video_url, video_title, file_url, file_title, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
	`, userID, user.Name, user.Email, eventTitle, eventDescription, eventPrice,
		posterURL, videoURL, videoTitle, fileURL, fileTitle)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan pengajuan"})
		return
	}

	submissionID, _ := result.LastInsertId()

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
