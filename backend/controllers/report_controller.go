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

// SubmitReport - User submits a report
func SubmitReport(c *gin.Context) {
	// Get user ID (optional - can be anonymous)
	var userID *int64
	if v, exists := c.Get("user_id"); exists {
		if uid, ok := v.(int64); ok && uid > 0 {
			userID = &uid
		}
	}

	category := c.PostForm("category")
	subject := c.PostForm("subject")
	description := c.PostForm("description")

	if subject == "" || description == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Subject dan description wajib diisi"})
		return
	}

	// Handle photo upload
	var photoURL string
	if file, err := c.FormFile("photo"); err == nil {
		os.MkdirAll("uploads/reports", os.ModePerm)
		filename := fmt.Sprintf("report_%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], filepath.Ext(file.Filename))
		photoPath := filepath.Join("uploads/reports", filename)
		if err := c.SaveUploadedFile(file, photoPath); err == nil {
			photoURL = photoPath
		}
	}

	_, err := config.DB.Exec(`
		INSERT INTO reports (user_id, category, subject, description, photo_url)
		VALUES (?, ?, ?, ?, ?)
	`, userID, category, subject, description, photoURL)

	if err != nil {
		fmt.Printf("[REPORT] Error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan laporan"})
		return
	}

	// Notify admins
	go func() {
		var adminIDs []int64
		config.DB.Select(&adminIDs, `
			SELECT u.id FROM users u
			JOIN user_roles ur ON u.id = ur.user_id
			JOIN roles r ON ur.role_id = r.id
			WHERE r.name = 'ADMIN'
		`)
		for _, adminID := range adminIDs {
			CreateNotification(adminID, "new_report", "📢 Laporan Baru", "Ada laporan baru: "+subject)
		}
	}()

	c.JSON(http.StatusCreated, gin.H{"message": "Laporan berhasil dikirim"})
}

// GetReports - Admin gets all reports
func GetReports(c *gin.Context) {
	var reports []struct {
		ID          int64   `db:"id" json:"id"`
		UserID      *int64  `db:"user_id" json:"user_id"`
		UserName    *string `db:"user_name" json:"user_name"`
		Category    string  `db:"category" json:"category"`
		Subject     string  `db:"subject" json:"subject"`
		Description string  `db:"description" json:"description"`
		PhotoURL    *string `db:"photo_url" json:"photo_url"`
		Status      string  `db:"status" json:"status"`
		AdminNotes  *string `db:"admin_notes" json:"admin_notes"`
		CreatedAt   string  `db:"created_at" json:"created_at"`
	}

	err := config.DB.Select(&reports, `
		SELECT r.id, r.user_id, u.name as user_name, r.category, r.subject, 
		       r.description, r.photo_url, r.status, r.admin_notes, r.created_at
		FROM reports r
		LEFT JOIN users u ON r.user_id = u.id
		ORDER BY r.created_at DESC
	`)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch reports"})
		return
	}

	c.JSON(200, gin.H{"reports": reports})
}

// UpdateReportStatus - Admin updates report status
func UpdateReportStatus(c *gin.Context) {
	reportID := c.Param("id")

	var input struct {
		Status     string `json:"status"`
		AdminNotes string `json:"admin_notes"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	_, err := config.DB.Exec(`
		UPDATE reports SET status = ?, admin_notes = ? WHERE id = ?
	`, input.Status, input.AdminNotes, reportID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to update report"})
		return
	}

	c.JSON(200, gin.H{"message": "Report updated"})
}
