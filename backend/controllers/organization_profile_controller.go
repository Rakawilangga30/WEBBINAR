package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
	"BACKEND/models"
)

// =======================================
// ORGANIZATION: GET PROFILE
// =======================================
func GetOrganizationProfile(c *gin.Context) {

	userID := c.GetInt64("user_id")

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
		    website = ?
		WHERE owner_user_id = ?
	`,
		req.Name,
		req.Description,
		req.Category,
		req.LogoURL,
		req.Email,
		req.Phone,
		req.Website,
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