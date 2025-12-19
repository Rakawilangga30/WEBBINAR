package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"BACKEND/config"

	"github.com/gin-gonic/gin"
)

// Helper cek kepemilikan (Sama seperti sebelumnya, tapi kita log errornya)
func checkEventOwnedByUserID(eventID int64, userID int64) bool {
	var count int
	config.DB.Get(&count, `
		SELECT COUNT(*) FROM events e 
		JOIN organizations o ON e.organization_id = o.id 
		WHERE e.id = ? AND o.owner_user_id = ?
	`, eventID, userID)
	return count > 0
}

func PublishEvent(c *gin.Context) {
	userID := c.GetInt64("user_id")
	eventID, _ := strconv.ParseInt(c.Param("eventID"), 10, 64)

	if !checkEventOwnedByUserID(eventID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	_, err := config.DB.Exec(`UPDATE events SET publish_status = 'PUBLISHED', publish_at = NULL WHERE id = ?`, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to publish"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event published!", "status": "PUBLISHED"})
}

func UnpublishEvent(c *gin.Context) {
	userID := c.GetInt64("user_id")
	eventID, _ := strconv.ParseInt(c.Param("eventID"), 10, 64)

	if !checkEventOwnedByUserID(eventID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	_, err := config.DB.Exec(`UPDATE events SET publish_status = 'DRAFT', publish_at = NULL WHERE id = ?`, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unpublish"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event drafted!", "status": "DRAFT"})
}

// FIX: Parsing Tanggal yang Fleksibel untuk Schedule
type ScheduleRequest struct {
	PublishAt string `json:"publish_at" binding:"required"`
}

func SchedulePublish(c *gin.Context) {
	userID := c.GetInt64("user_id")
	eventID, _ := strconv.ParseInt(c.Param("eventID"), 10, 64)

	if !checkEventOwnedByUserID(eventID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var req ScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	// 1. Coba format dari HTML datetime-local (contoh: 2025-12-19T18:00)
	// Kita tambah ":00" detik agar sesuai format SQL standard jika perlu
	layoutHTML := "2006-01-02T15:04"
	layoutISO := time.RFC3339

	parsedTime, err := time.Parse(layoutHTML, req.PublishAt)
	if err != nil {
		// Jika gagal, coba format ISO lengkap
		parsedTime, err = time.Parse(layoutISO, req.PublishAt)
		if err != nil {
			fmt.Println("❌ Date Parse Error:", err, "Input:", req.PublishAt)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal tidak valid."})
			return
		}
	}

	// 2. Ubah ke format SQL
	sqlTimeStr := parsedTime.Format("2006-01-02 15:04:05")

	_, err = config.DB.Exec(`
		UPDATE events 
		SET publish_status = 'SCHEDULED', publish_at = ? 
		WHERE id = ?
	`, sqlTimeStr, eventID)

	if err != nil {
		fmt.Println("❌ DB Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Event scheduled!",
		"status":     "SCHEDULED",
		"publish_at": req.PublishAt,
	})
}
