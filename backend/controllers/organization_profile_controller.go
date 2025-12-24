package controllers

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
	"BACKEND/models"
)

// =======================================
// ORGANIZATION: GET PROFILE
// =======================================
func GetOrganizationProfile(c *gin.Context) {

	// Read user_id from context robustly
	var userID int64
	if v, ok := c.Get("user_id"); ok {
		switch t := v.(type) {
		case int64:
			userID = t
		case int:
			userID = int64(t)
		case float64:
			userID = int64(t)
		default:
			userID = 0
		}
	}

	var org models.Organization

	err := config.DB.Get(&org, `
		SELECT * FROM organizations WHERE owner_user_id = ?
	`, userID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization profile not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"organization": org})
}

// =======================================
// ORGANIZATION: UPDATE PROFILE
// =======================================

type UpdateOrgProfileRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	LogoURL     string `json:"logo_url"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Website     string `json:"website"`
	SocialLink  string `json:"social_link"`
	Address     string `json:"address"`
}

func UpdateOrganizationProfile(c *gin.Context) {

	userID := c.GetInt64("user_id")

	var req UpdateOrgProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := config.DB.Exec(`
		UPDATE organizations 
		SET name = ?, 
			description = ?, 
			category = ?, 
			logo_url = ?, 
			email = ?, 
			phone = ?, 
			website = ?,
			social_link = ?,
			address = ?
		WHERE owner_user_id = ?
	`,
		req.Name,
		req.Description,
		req.Category,
		req.LogoURL,
		req.Email,
		req.Phone,
		req.Website,
		req.SocialLink,
		req.Address,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update organization profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Organization profile updated successfully",
	})
}

// =======================================
// ORGANIZATION: REPORT (TOTAL EVENT + BUYERS PER EVENT + REVENUE)
// =======================================
func GetOrganizationReport(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// 1. Ambil org id milik user
	var orgID int64
	err := config.DB.Get(&orgID, `SELECT id FROM organizations WHERE owner_user_id = ?`, userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Organization not found"})
		return
	}

	// 2. Total events
	var total int
	config.DB.Get(&total, `SELECT COUNT(*) FROM events WHERE organization_id = ?`, orgID)

	// 3. Detail events with buyer counts and revenue
	type EventStat struct {
		ID           int64   `db:"id" json:"id"`
		Title        string  `db:"title" json:"title"`
		ThumbnailURL *string `db:"thumbnail_url" json:"thumbnail_url"`
		Buyers       int     `db:"buyers" json:"buyers"`
		Revenue      float64 `db:"revenue" json:"revenue"`
		CreatedAt    string  `db:"created_at" json:"created_at"`
	}

	var events []EventStat
	query := `
		SELECT e.id, e.title, e.thumbnail_url, e.created_at,
			(SELECT COUNT(DISTINCT p.user_id) FROM purchases p JOIN sessions s ON p.session_id = s.id WHERE s.event_id = e.id) AS buyers,
			(SELECT COALESCE(SUM(p.price_paid), 0) FROM purchases p JOIN sessions s ON p.session_id = s.id WHERE s.event_id = e.id) AS revenue
		FROM events e
		WHERE e.organization_id = ?
		ORDER BY e.created_at DESC
	`
	config.DB.Select(&events, query, orgID)

	if events == nil {
		events = []EventStat{}
	}

	// 4. Calculate total revenue
	var totalRevenue float64
	for _, e := range events {
		totalRevenue += e.Revenue
	}

	// 5. Calculate withdrawable amount (e.g. 90% after platform fee)
	withdrawable := totalRevenue * 0.90

	c.JSON(200, gin.H{
		"total_events":  total,
		"events":        events,
		"total_revenue": totalRevenue,
		"withdrawable":  withdrawable,
		"platform_fee":  0.10,
	})
}

// =======================================
// ORGANIZATION: UPLOAD LOGO
// =======================================
func UploadOrganizationLogo(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Get file from form
	file, err := c.FormFile("logo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Logo file is required"})
		return
	}

	// Validate file size (max 2MB)
	if file.Size > 2*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must be less than 2MB"})
		return
	}

	// Generate unique filename
	ext := ".jpg"
	if file.Filename != "" {
		for _, e := range []string{".png", ".jpg", ".jpeg", ".gif", ".webp"} {
			if len(file.Filename) > len(e) && file.Filename[len(file.Filename)-len(e):] == e {
				ext = e
				break
			}
		}
	}

	// Get org ID
	var orgID int64
	err = config.DB.Get(&orgID, `SELECT id FROM organizations WHERE owner_user_id = ?`, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	// Create directory if not exists
	uploadDir := "uploads/organization"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate unique filename with timestamp
	filename := fmt.Sprintf("org_logo_%d_%d%s", orgID, time.Now().UnixNano(), ext)
	uploadPath := uploadDir + "/" + filename

	// Save file
	if err := c.SaveUploadedFile(file, uploadPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save logo file: " + err.Error()})
		return
	}

	// Update database
	_, err = config.DB.Exec(`UPDATE organizations SET logo_url = ? WHERE owner_user_id = ?`, uploadPath, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update logo URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Logo uploaded successfully",
		"logo_url": uploadPath,
	})
}

// =======================================
// ORGANIZATION: GET EVENT BUYERS
// =======================================
func GetEventBuyers(c *gin.Context) {
	userID := c.GetInt64("user_id")
	eventID := c.Param("eventID")

	// Verify organization owns this event
	var orgID int64
	err := config.DB.Get(&orgID, `SELECT id FROM organizations WHERE owner_user_id = ?`, userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Organization not found"})
		return
	}

	var eventOrgID int64
	err = config.DB.Get(&eventOrgID, `SELECT organization_id FROM events WHERE id = ?`, eventID)
	if err != nil || eventOrgID != orgID {
		c.JSON(403, gin.H{"error": "Event not found or not owned by your organization"})
		return
	}

	// Get buyer details
	type BuyerInfo struct {
		UserID        int64   `db:"user_id" json:"user_id"`
		UserName      string  `db:"user_name" json:"user_name"`
		UserEmail     string  `db:"user_email" json:"user_email"`
		SessionsCount int     `db:"sessions_count" json:"sessions_count"`
		TotalPaid     float64 `db:"total_paid" json:"total_paid"`
	}

	var buyers []BuyerInfo
	query := `
		SELECT 
			p.user_id,
			u.name as user_name,
			u.email as user_email,
			COUNT(p.id) as sessions_count,
			SUM(p.price_paid) as total_paid
		FROM purchases p
		JOIN users u ON p.user_id = u.id
		JOIN sessions s ON p.session_id = s.id
		WHERE s.event_id = ?
		GROUP BY p.user_id, u.name, u.email
		ORDER BY total_paid DESC
	`
	config.DB.Select(&buyers, query, eventID)

	if buyers == nil {
		buyers = []BuyerInfo{}
	}

	c.JSON(200, gin.H{"buyers": buyers})
}
