package controllers

import (
	"fmt"
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
		`SELECT id, user_id, org_name, 
		 COALESCE(org_description, '') AS org_description, 
		 COALESCE(org_category, '') AS org_category, 
		 COALESCE(org_logo_url, '') AS org_logo_url, 
		 COALESCE(org_email, '') AS org_email, 
		 COALESCE(org_phone, '') AS org_phone, 
		 COALESCE(org_website, '') AS org_website,
		 COALESCE(reason, '') AS reason, 
		 COALESCE(social_media, '') AS social_media, 
		 COALESCE(bank_name, '') AS bank_name,
		 COALESCE(bank_account, '') AS bank_account,
		 COALESCE(bank_account_name, '') AS bank_account_name,
		 status, reviewed_by, reviewed_at, 
		 COALESCE(review_note, '') AS review_note, 
		 submitted_at
		 FROM organization_applications WHERE id = ?`,
		appID,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	// Jika APPROVED → buat ORGANIZATION & update role user
	if req.Status == "APPROVED" {

		// Jika org_email kosong, pakai email user sebagai fallback
		orgEmail := application.OrgEmail
		if orgEmail == "" {
			config.DB.Get(&orgEmail, "SELECT email FROM users WHERE id = ?", application.UserID)
		}

		// Jika org_phone kosong, pakai phone user sebagai fallback
		orgPhone := application.OrgPhone
		if orgPhone == "" {
			config.DB.Get(&orgPhone, "SELECT COALESCE(phone, '') FROM users WHERE id = ?", application.UserID)
		}

		// Insert ke tabel organizations
		_, err := config.DB.Exec(`
			INSERT INTO organizations 
			(owner_user_id, name, description, category, logo_url, email, phone, website, social_link)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
			application.UserID,
			application.OrgName,
			application.OrgDescription,
			application.OrgCategory,
			application.OrgLogoURL,
			orgEmail,
			orgPhone,
			application.OrgWebsite,
			application.SocialMedia,
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

	// Create notification for user
	if req.Status == "APPROVED" {
		CreateNotification(
			application.UserID,
			"application_approved",
			"🎉 Pengajuan Disetujui!",
			"Selamat! Pengajuan organisasi \""+application.OrgName+"\" telah disetujui. Anda sekarang dapat membuat event.",
		)
	} else if req.Status == "REJECTED" {
		message := "Pengajuan organisasi \"" + application.OrgName + "\" ditolak."
		if req.Note != "" {
			message += " Alasan: " + req.Note
		}
		CreateNotification(
			application.UserID,
			"application_rejected",
			"❌ Pengajuan Ditolak",
			message,
		)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Application reviewed successfully",
		"status":  req.Status,
	})
}

// =======================================
// ADMIN: GET ALL ORGANIZATION APPLICATIONS
// =======================================

type ApplicationWithUser struct {
	models.OrganizationApplication
	UserName       string  `db:"user_name" json:"user_name"`
	UserEmail      string  `db:"user_email" json:"user_email"`
	UserProfileImg *string `db:"user_profile_img" json:"user_profile_img"`
}

func GetAllOrganizationApplications(c *gin.Context) {

	var applications []ApplicationWithUser

	err := config.DB.Select(&applications, `
		SELECT 
			oa.id, oa.user_id, oa.org_name, 
			COALESCE(oa.org_description, '') AS org_description, 
			COALESCE(oa.org_category, '') AS org_category, 
			COALESCE(oa.org_logo_url, '') AS org_logo_url, 
			COALESCE(oa.org_email, '') AS org_email, 
			COALESCE(oa.org_phone, '') AS org_phone, 
			COALESCE(oa.org_website, '') AS org_website,
			COALESCE(oa.reason, '') AS reason, 
			COALESCE(oa.social_media, '') AS social_media, 
			COALESCE(oa.bank_name, '') AS bank_name, 
			COALESCE(oa.bank_account, '') AS bank_account, 
			COALESCE(oa.bank_account_name, '') AS bank_account_name,
			oa.status, oa.reviewed_by, oa.reviewed_at, 
			COALESCE(oa.review_note, '') AS review_note, 
			oa.submitted_at,
			COALESCE(u.name, '') AS user_name,
			COALESCE(u.email, '') AS user_email,
			u.profile_img AS user_profile_img
		FROM organization_applications oa
		LEFT JOIN users u ON oa.user_id = u.id
		ORDER BY oa.submitted_at DESC
	`)

	if err != nil {
		fmt.Println("Error fetching applications:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"applications": applications})
}

// =======================================
// ADMIN: GET SINGLE APPLICATION DETAIL
// =======================================
func GetOrganizationApplicationByID(c *gin.Context) {

	id := c.Param("id")

	var application ApplicationWithUser

	err := config.DB.Get(&application, `
		SELECT 
			oa.id, oa.user_id, oa.org_name, 
			COALESCE(oa.org_description, '') AS org_description, 
			COALESCE(oa.org_category, '') AS org_category, 
			COALESCE(oa.org_logo_url, '') AS org_logo_url, 
			COALESCE(oa.org_email, '') AS org_email, 
			COALESCE(oa.org_phone, '') AS org_phone, 
			COALESCE(oa.org_website, '') AS org_website,
			COALESCE(oa.reason, '') AS reason, 
			COALESCE(oa.social_media, '') AS social_media, 
			COALESCE(oa.bank_name, '') AS bank_name, 
			COALESCE(oa.bank_account, '') AS bank_account, 
			COALESCE(oa.bank_account_name, '') AS bank_account_name,
			oa.status, oa.reviewed_by, oa.reviewed_at, 
			COALESCE(oa.review_note, '') AS review_note, 
			oa.submitted_at,
			COALESCE(u.name, '') AS user_name,
			COALESCE(u.email, '') AS user_email,
			u.profile_img AS user_profile_img
		FROM organization_applications oa
		LEFT JOIN users u ON oa.user_id = u.id
		WHERE oa.id = ?
	`, id)

	if err != nil {
		fmt.Println("Error fetching application detail:", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"application": application})
}
