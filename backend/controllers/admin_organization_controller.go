package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
	"BACKEND/models"
)

// ================================
// ADMIN: REVIEW APPLICATION
// ================================

type ReviewOrganizationRequest struct {
	Status string `json:"status" binding:"required"` // APPROVED / REJECTED
	Note   string `json:"note"`
}

func ReviewOrganizationApplication(c *gin.Context) {

	appID := c.Param("id")
	adminID := c.GetInt64("user_id")

	var req ReviewOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Ambil data application
	var application models.OrganizationApplication
	err := config.DB.Get(&application,
		"SELECT * FROM organization_applications WHERE id = ?",
		appID,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	// Jika APPROVED → buat ORGANIZATION & update role user
	if req.Status == "APPROVED" {

		// Insert ke tabel organizations
		_, err := config.DB.Exec(`
			INSERT INTO organizations 
			(owner_user_id, name, description, category, logo_url, email, phone, website)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`,
			application.UserID,
			application.OrgName,
			application.OrgDescription,
			application.OrgCategory,
			application.OrgLogoURL,
			application.OrgEmail,
			application.OrgPhone,
			application.OrgWebsite,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization"})
			return
		}

		// Update role → ORGANIZATION (role_id = 2)
		_, err = config.DB.Exec(`
			UPDATE user_roles SET role_id = 2 WHERE user_id = ?
		`, application.UserID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
			return
		}
	}

	// Update status pengajuan
	_, err = config.DB.Exec(`
		UPDATE organization_applications
		SET status = ?, reviewed_by = ?, reviewed_at = ?, review_note = ?
		WHERE id = ?
	`,
		req.Status,
		adminID,
		time.Now(),
		req.Note,
		appID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Application reviewed successfully",
		"status":  req.Status,
	})
}

// =======================================
// ADMIN: GET ALL ORGANIZATION APPLICATIONS
// =======================================
func GetAllOrganizationApplications(c *gin.Context) {

	var applications []models.OrganizationApplication

	err := config.DB.Select(&applications, `
		SELECT * FROM organization_applications 
		ORDER BY submitted_at DESC
	`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"applications": applications})
}

// =======================================
// ADMIN: GET SINGLE APPLICATION DETAIL
// =======================================
func GetOrganizationApplicationByID(c *gin.Context) {

	id := c.Param("id")

	var application models.OrganizationApplication

	err := config.DB.Get(&application, `
		SELECT * FROM organization_applications WHERE id = ?
	`, id)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"application": application})
}

