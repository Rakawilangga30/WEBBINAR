package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
	"BACKEND/models"
)

// =============================
// USER APPLY ORGANIZATION
// =============================

type ApplyOrganizationRequest struct {
	OrgName        string `json:"org_name" binding:"required"`
	OrgDescription string `json:"org_description"`
	OrgCategory    string `json:"org_category"`
	OrgLogoURL     string `json:"org_logo_url"`

	OrgEmail   string `json:"org_email"`
	OrgPhone   string `json:"org_phone"`
	OrgWebsite string `json:"org_website"`

	Reason      string `json:"reason" binding:"required"`
	SocialMedia string `json:"social_media"`
}

func ApplyOrganization(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// 1. Check apakah user sudah pernah mengajukan
	var count int
	config.DB.Get(&count,
		"SELECT COUNT(*) FROM organization_applications WHERE user_id = ? AND status = 'PENDING'",
		userID,
	)

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have a pending application"})
		return
	}

	// 2. Bind JSON request
	var req ApplyOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	// 3. Insert into database
	_, err := config.DB.Exec(`
		INSERT INTO organization_applications 
		(user_id, org_name, org_description, org_category, org_logo_url, 
		 org_email, org_phone, org_website, reason, social_media, submitted_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`,
		userID,
		req.OrgName,
		req.OrgDescription,
		req.OrgCategory,
		req.OrgLogoURL,
		req.OrgEmail,
		req.OrgPhone,
		req.OrgWebsite,
		req.Reason,
		req.SocialMedia,
		time.Now(),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit application"})
		return
	}

	// 4. Return success
	c.JSON(http.StatusOK, gin.H{
		"message": "Organization application submitted successfully",
	})
}

// Struktur Request untuk Sesi
type CreateSessionRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Price       int64  `json:"price"`
}

// =======================================
// ORGANIZATION: CREATE SESSION
// =======================================
func CreateSession(c *gin.Context) {
	eventID := c.Param("eventID")

	userID := c.GetInt64("user_id")
	orgID, err := getOrganizationIDByUser(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization"})
		return
	}

	// Cek kepemilikan event
	var count int
	config.DB.Get(&count, "SELECT COUNT(*) FROM events WHERE id = ? AND organization_id = ?", eventID, orgID)
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Event not found or access denied"})
		return
	}

	var req CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var maxOrder int
	config.DB.Get(&maxOrder, "SELECT COALESCE(MAX(order_index), 0) FROM sessions WHERE event_id = ?", eventID)

	res, err := config.DB.Exec(`
		INSERT INTO sessions (event_id, title, description, price, order_index, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`,
		eventID, req.Title, req.Description, req.Price, maxOrder+1, time.Now(),
	)

	if err != nil {
		fmt.Println("❌ Error Create Session:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat sesi"})
		return
	}

	sessionID, _ := res.LastInsertId()
	c.JSON(http.StatusOK, gin.H{"message": "Session created!", "session_id": sessionID})
}

// =======================================
// ORGANIZATION: GET MY EVENT DETAIL
// =======================================
func GetMyEventDetail(c *gin.Context) {
	eventID := c.Param("eventID")
	userID := c.GetInt64("user_id")

	// 1. Ambil Org ID user
	orgID, err := getOrganizationIDByUser(userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid organization"})
		return
	}

	// 2. Ambil Event (DRAFT maupun PUBLISHED, asalkan milik org ini)
	var event models.Event
	err = config.DB.Get(&event, `
		SELECT id, organization_id, title, description, category, thumbnail_url, 
		       publish_status, publish_at, created_at, updated_at 
		FROM events 
		WHERE id = ? AND organization_id = ?
	`, eventID, orgID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found or access denied"})
		return
	}

	// 3. Ambil Sesi
	var sessions []models.Session
	err = config.DB.Select(&sessions, `
		SELECT id, event_id, title, description, price, order_index, created_at 
		FROM sessions 
		WHERE event_id = ? 
		ORDER BY order_index ASC
	`, eventID)

	if err != nil {
		sessions = []models.Session{}
	}

	c.JSON(http.StatusOK, gin.H{
		"event":    event,
		"sessions": sessions,
	})
}
