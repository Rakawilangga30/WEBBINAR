package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"BACKEND/config"
)

// Helper Check
func checkEventOwnedByUserID(eventID int64, userID int64) bool {
	var count int
	config.DB.Get(&count, `SELECT COUNT(*) FROM events e JOIN organizations o ON e.organization_id = o.id WHERE e.id = ? AND o.owner_user_id = ?`, eventID, userID)
	return count > 0
}

// 1. PUBLISH
func PublishEvent(c *gin.Context) {
	userID := c.GetInt64("user_id")
	eventID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	if !checkEventOwnedByUserID(eventID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	_, err := config.DB.Exec(`UPDATE events SET publish_status = 'PUBLISHED', publish_at = NULL, updated_at = ? WHERE id = ?`, time.Now(), eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to publish"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event published!", "status": "PUBLISHED"})
}

// 2. UNPUBLISH
func UnpublishEvent(c *gin.Context) {
	userID := c.GetInt64("user_id")
	eventID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	if !checkEventOwnedByUserID(eventID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	_, err := config.DB.Exec(`UPDATE events SET publish_status = 'DRAFT', publish_at = NULL, updated_at = ? WHERE id = ?`, time.Now(), eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unpublish"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event drafted!", "status": "DRAFT"})
}

// 3. SCHEDULE (FIX Parsing Tanggal)
type ScheduleRequest struct {
	PublishAt string `json:"publish_at" binding:"required"`
}

func SchedulePublish(c *gin.Context) {
	userID := c.GetInt64("user_id")
	eventID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	if !checkEventOwnedByUserID(eventID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var req ScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	// Parsing ISO Date String ke Time Object
	parsedTime, err := time.Parse(time.RFC3339, req.PublishAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use ISO8601"})
		return
	}

	_, err = config.DB.Exec(`UPDATE events SET publish_status = 'SCHEDULED', publish_at = ?, updated_at = ? WHERE id = ?`, parsedTime, time.Now(), eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to schedule"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event scheduled!", "status": "SCHEDULED", "publish_at": req.PublishAt})
}