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
	// Ambil user_id dengan robust
	var userID int64
	if v, ok := c.Get("user_id"); ok {
		switch t := v.(type) {
		case int64:
			userID = t
		case int:
			userID = int64(t)
		case float64:
			userID = int64(t)
		}
	}

	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

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

	// Nama file unik: user_{id}_{timestamp}.{ext}
	filename := fmt.Sprintf("user_%d_%d%s", userID, time.Now().Unix(), ext)
	// Pastikan masuk ke folder 'profile/' di bucket Supabase
	storagePath := "profile/" + filename

	// Upload to Supabase using Header helper
	publicURL, err := utils.UploadFileHeaderToSupabase(storagePath, file)
	if err != nil {
		fmt.Printf("❌ Supabase upload error for user %d: %v\n", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image to storage: " + err.Error()})
		return
	}

	// Pastikan URL valid
	if publicURL == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Upload succeeded but returned empty URL"})
		return
	}

	// Simpan URL ke database
	_, err = config.DB.Exec(`
		UPDATE users SET profile_img = ? WHERE id = ?
	`, publicURL, userID)

	if err != nil {
		// Log error database
		fmt.Printf("❌ Database update error for user %d: %v\n", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image URL to database"})
		return
	}

	fmt.Printf("✅ Profile image updated for user %d: %s\n", userID, publicURL)

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile image uploaded successfully",
		"url":     publicURL,
	})
}
