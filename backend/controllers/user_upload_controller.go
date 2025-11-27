package controllers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
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

	// Path tujuan (folder relatif dari root project backend)
	uploadPath := "uploads/profile/" + filename

	// Simpan file ke disk
	if err := c.SaveUploadedFile(file, uploadPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image"})
		return
	}

	// Simpan path ke database
	_, err = config.DB.Exec(`
		UPDATE users SET profile_img = ? WHERE id = ?
	`, uploadPath, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile image uploaded successfully",
		"url":     uploadPath,
	})
}
