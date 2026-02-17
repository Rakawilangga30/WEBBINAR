package controllers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
	"BACKEND/utils"
)

// =======================================
// USER: UPLOAD PROFILE IMAGE
// =======================================
func UploadProfileImage(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Ambil file dari form-data
	file, err := c.FormFile("profile_img")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Profile image is required"})
		return
	}

	// Validasi ekstensi file
	ext := filepath.Ext(file.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only JPG, JPEG, PNG, WEBP allowed"})
		return
	}

	// Nama file unik
	filename := fmt.Sprintf("user_%d_%d%s", userID, time.Now().Unix(), ext)
	storagePath := "profile/" + filename

	// Upload to Supabase
	publicURL, err := utils.UploadFileHeaderToSupabase(storagePath, file)
	if err != nil {
		fmt.Printf("❌ Supabase upload error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image"})
		return
	}

	// Simpan URL ke database
	_, err = config.DB.Exec(`
		UPDATE users SET profile_img = ? WHERE id = ?
	`, publicURL, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile image uploaded successfully",
		"url":     publicURL,
	})
}
