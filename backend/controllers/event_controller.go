package controllers

import (
	"fmt" // <--- Penting untuk melihat error di terminal
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
	"BACKEND/models"
)

// Helper: ambil organization_id dari user yang login
func getOrganizationIDByUser(userID int64) (int64, error) {
	var orgID int64
	err := config.DB.Get(&orgID,
		"SELECT id FROM organizations WHERE owner_user_id = ?",
		userID,
	)
	return orgID, err
}

// =======================================
// ORGANIZATION: CREATE EVENT
// =======================================

type CreateEventRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

func CreateEvent(c *gin.Context) {
	userID := c.GetInt64("user_id")

	orgID, err := getOrganizationIDByUser(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found for this user"})
		return
	}

	var req CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	// Update Query: Menambahkan publish_status default 'DRAFT'
	res, err := config.DB.Exec(`
		INSERT INTO events (organization_id, title, description, category, publish_status, created_at, updated_at)
		VALUES (?, ?, ?, ?, 'DRAFT', ?, ?)
	`,
		orgID,
		req.Title,
		req.Description,
		req.Category,
		time.Now(),
		time.Now(),
	)
	if err != nil {
		fmt.Println("❌ Error Create Event:", err) // <--- Debug Error
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	eventID, _ := res.LastInsertId()

	c.JSON(http.StatusOK, gin.H{
		"message":  "Event created successfully",
		"event_id": eventID,
	})
}

// =======================================
// ORGANIZATION: LIST MY EVENTS
// =======================================
func ListMyEvents(c *gin.Context) {
	userID := c.GetInt64("user_id")

	orgID, err := getOrganizationIDByUser(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found for this user"})
		return
	}

	var events []models.Event
	// PERBAIKAN: Jangan pakai SELECT *, tapi sebutkan kolom satu per satu
	// agar kolom 'is_published' (sisa lama) tidak ikut terambil dan bikin error.
	err = config.DB.Select(&events, `
		SELECT id, organization_id, title, description, category, thumbnail_url, 
		       publish_status, publish_at, created_at, updated_at 
		FROM events 
		WHERE organization_id = ?
		ORDER BY created_at DESC
	`, orgID)

	if err != nil {
		fmt.Println("❌ Error Fetching Events:", err) 
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}
