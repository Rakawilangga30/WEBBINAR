package controllers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
	"BACKEND/helpers"
)

func GetSignedVideoURL(c *gin.Context) {
	userID := c.GetInt64("user_id")
	filename := c.Param("filename")

	// 1. Coba cari URL asli di database (untuk support Supabase)
	var videoURL string
	// Gunakan LIKE %filename karena filename mungkin hanya bagian akhir dari URL
	err := config.DB.Get(&videoURL, "SELECT video_url FROM session_videos WHERE video_url LIKE ?", "%"+filename)

	if err == nil && strings.HasPrefix(videoURL, "http") {
		// Jika ketemu dan itu URL eksternal (Supabase), kembalikan langsung
		c.JSON(http.StatusOK, gin.H{"url": videoURL})
		return
	}

	// 2. Jika tidak ketemu atau file lokal, gunakan mekanisme legacy (Signed URL ke Stream Controller)
	token, exp := helpers.GenerateSignedToken(userID, filename)

	// Masukkan uid ke dalam URL agar controller stream tau siapa yang nonton
	signedURL := fmt.Sprintf("/api/user/sessions/video/%s?token=%s&exp=%d&uid=%d",
		filename, token, exp, userID)

	c.JSON(http.StatusOK, gin.H{"url": signedURL})
}

func GetSignedFileURL(c *gin.Context) {
	userID := c.GetInt64("user_id")
	filename := c.Param("filename")

	// 1. Coba cari URL asli di database
	var fileURL string
	err := config.DB.Get(&fileURL, "SELECT file_url FROM session_files WHERE file_url LIKE ?", "%"+filename)

	if err == nil && strings.HasPrefix(fileURL, "http") {
		c.JSON(http.StatusOK, gin.H{"url": fileURL})
		return
	}

	token, exp := helpers.GenerateSignedToken(userID, filename)

	signedURL := fmt.Sprintf("/api/user/sessions/file/%s?token=%s&exp=%d&uid=%d",
		filename, token, exp, userID)

	c.JSON(http.StatusOK, gin.H{"url": signedURL})
}
