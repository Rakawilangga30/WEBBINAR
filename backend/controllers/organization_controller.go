package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
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

	// 1. Check if user already has a pending application
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

	// Notify all admins about new application
	go func() {
		// Get applicant name
		var applicantName string
		config.DB.Get(&applicantName, "SELECT name FROM users WHERE id = ?", userID)

		// Get all admin user IDs
		var adminIDs []int64
		config.DB.Select(&adminIDs, `
			SELECT u.id FROM users u
			JOIN user_roles ur ON u.id = ur.user_id
			JOIN roles r ON ur.role_id = r.id
			WHERE r.name = 'ADMIN'
		`)

		// Send notification to each admin
		for _, adminID := range adminIDs {
			CreateNotification(
				adminID,
				"new_application",
				"📝 Pengajuan Baru!",
				applicantName+" mengajukan organisasi \""+req.OrgName+"\"",
			)
		}
	}()

	// 4. Return success
	c.JSON(http.StatusOK, gin.H{
		"message": "Organization application submitted successfully",
	})
}

// =============================
// USER: GET MY APPLICATION STATUS
// =============================
func GetMyApplicationStatus(c *gin.Context) {
	userID := c.GetInt64("user_id")

	type ApplicationStatus struct {
		ID          int64   `db:"id" json:"id"`
		Status      string  `db:"status" json:"status"`
		OrgName     string  `db:"org_name" json:"org_name"`
		SubmittedAt string  `db:"submitted_at" json:"submitted_at"`
		ReviewedAt  *string `db:"reviewed_at" json:"reviewed_at,omitempty"`
		ReviewNote  *string `db:"review_note" json:"review_note,omitempty"`
	}

	var app ApplicationStatus
	err := config.DB.Get(&app, `
		SELECT id, status, org_name, submitted_at, reviewed_at, review_note
		FROM organization_applications 
		WHERE user_id = ? 
		ORDER BY submitted_at DESC 
		LIMIT 1
	`, userID)

	if err != nil {
		// No application found
		c.JSON(http.StatusOK, gin.H{
			"has_application": false,
			"application":     nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"has_application": true,
		"application":     app,
	})
}

// Request Structure for Session
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

	// Check event ownership
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	sessionID, _ := res.LastInsertId()

	// Notify users who have purchased sessions from this event
	go func() {
		// Get event title
		var eventTitle string
		config.DB.Get(&eventTitle, "SELECT title FROM events WHERE id = ?", eventID)

		// Get all users who purchased any session of this event
		var buyerIDs []int64
		config.DB.Select(&buyerIDs, `
			SELECT DISTINCT p.user_id 
			FROM purchases p
			JOIN sessions s ON p.session_id = s.id
			WHERE s.event_id = ?
		`, eventID)

		// Send notification to each buyer
		for _, buyerID := range buyerIDs {
			CreateNotification(
				buyerID,
				"new_session",
				"📚 Sesi Baru Tersedia!",
				"Event \""+eventTitle+"\" menambahkan sesi baru: \""+req.Title+"\"",
			)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Session created!", "session_id": sessionID})
}
