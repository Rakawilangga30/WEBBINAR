package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"BACKEND/config"
	"BACKEND/helpers"

	"github.com/gin-gonic/gin"
)

// =============================================================
// STREAM VIDEO (Debug Version)
// =============================================================
func StreamSessionVideo(c *gin.Context) {
	filename := c.Param("filename")
	token := c.Query("token")
	expStr := c.Query("exp")
	uidStr := c.Query("uid")

	fmt.Println("\n--- DEBUG STREAM VIDEO ---")
	fmt.Println("Request Filename:", filename)
	fmt.Println("User ID:", uidStr)

	// 1. Cek Expired
	exp, _ := strconv.ParseInt(expStr, 10, 64)
	if time.Now().Unix() > exp {
		fmt.Println("❌ Error: URL Expired")
		c.JSON(403, gin.H{"error": "URL expired"})
		return
	}

	// 2. Validasi Token
	userID, _ := strconv.ParseInt(uidStr, 10, 64)
	if !helpers.ValidateSignedToken(userID, filename, exp, token) {
		fmt.Println("❌ Error: Invalid Token Signature")
		c.JSON(403, gin.H{"error": "Invalid token signature"})
		return
	}

	// 3. Cek Database (Pakai LIKE agar lebih aman)
	var sessionID int64
	// Mencari video yang URL-nya MENGANDUNG nama file ini
	err := config.DB.Get(&sessionID,
		"SELECT session_id FROM session_videos WHERE video_url LIKE ?",
		"%"+filename,
	)
	if err != nil {
		fmt.Println("❌ Error: Metadata video tidak ditemukan di DB untuk file:", filename)
		c.JSON(404, gin.H{"error": "Video metadata not found in database"})
		return
	}

	// 4. Cek Pembelian
	var count int
	config.DB.Get(&count,
		"SELECT COUNT(*) FROM purchases WHERE user_id=? AND session_id=?",
		userID, sessionID,
	)
	if count == 0 {
		fmt.Println("❌ Error: User belum beli sesi ini. SessionID:", sessionID)
		c.JSON(403, gin.H{"error": "Unauthorized access (not purchased)"})
		return
	}

	// 5. Cek Fisik File
	fullPath := filepath.Join("uploads/videos", filename)
	fmt.Println("Mencari file fisik di:", fullPath)

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		fmt.Println("❌ Error: File fisik tidak ditemukan di server!")
		// Coba cari di folder files barangkali salah upload
		c.JSON(404, gin.H{"error": "Video file not found on server"})
		return
	}

	// 6. Serve File
	fmt.Println("✅ Sukses! Memulai streaming...")
	http.ServeFile(c.Writer, c.Request, fullPath)
}

// =============================================================
// STREAM FILE (Debug Version)
// =============================================================
func StreamSessionFile(c *gin.Context) {
	filename := c.Param("filename")
	token := c.Query("token")
	expStr := c.Query("exp")
	uidStr := c.Query("uid")

	fmt.Println("\n--- DEBUG STREAM FILE ---")
	fmt.Println("Request Filename:", filename)

	exp, _ := strconv.ParseInt(expStr, 10, 64)
	if time.Now().Unix() > exp {
		c.JSON(403, gin.H{"error": "URL expired"})
		return
	}

	userID, _ := strconv.ParseInt(uidStr, 10, 64)
	if !helpers.ValidateSignedToken(userID, filename, exp, token) {
		c.JSON(403, gin.H{"error": "Invalid token"})
		return
	}

	var sessionID int64
	err := config.DB.Get(&sessionID,
		"SELECT session_id FROM session_files WHERE file_url LIKE ?",
		"%"+filename,
	)
	if err != nil {
		fmt.Println("❌ Error: Metadata file tidak ditemukan di DB")
		c.JSON(404, gin.H{"error": "File metadata not found"})
		return
	}

	var count int
	config.DB.Get(&count,
		"SELECT COUNT(*) FROM purchases WHERE user_id=? AND session_id=?",
		userID, sessionID,
	)
	if count == 0 {
		c.JSON(403, gin.H{"error": "Unauthorized"})
		return
	}

	fullPath := filepath.Join("uploads/files", filename)
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		fmt.Println("❌ Error: File fisik tidak ditemukan:", fullPath)
		c.JSON(404, gin.H{"error": "File not found"})
		return
	}

	fmt.Println("✅ Sukses! Membuka file...")
	http.ServeFile(c.Writer, c.Request, fullPath)
}
