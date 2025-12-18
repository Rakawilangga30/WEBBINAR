package controllers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
	"BACKEND/models"
)

const MaxVideoSize = 1 << 30 // 1 GB
// =======================================
// UPLOAD VIDEO KE SESI
// =======================================
func UploadSessionVideo(c *gin.Context) {
	sessionIDStr := c.Param("sessionID")
	userID := c.GetInt64("user_id")

	var sessionID int64
	if _, err := fmt.Sscan(sessionIDStr, &sessionID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	// Cek Kepemilikan (PENTING)
	if !checkSessionOwnedByUser(sessionID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't own this session"})
		return
	}

	// 1. Ambil File
	file, header, err := c.Request.FormFile("video")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Video file is required"})
		return
	}
	defer file.Close()

	// 2. Ambil Input Judul & Deskripsi
	titleInput := c.PostForm("title")
	descriptionInput := c.PostForm("description")

	finalTitle := titleInput
	if finalTitle == "" {
		finalTitle = header.Filename
	}

	// 3. Simpan File
	ext := filepath.Ext(header.Filename)
	uniqueName := fmt.Sprintf("session_%d_%d%s", sessionID, time.Now().Unix(), ext)
	filePath := "uploads/videos/" + uniqueName

	os.MkdirAll("uploads/videos", os.ModePerm)

	out, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save video file"})
		return
	}
	defer out.Close()
	io.Copy(out, file)

	// 4. Update Database
	var maxOrder int
	config.DB.Get(&maxOrder, "SELECT COALESCE(MAX(order_index), 0) FROM session_videos WHERE session_id = ?", sessionID)

	_, err = config.DB.Exec(`
		INSERT INTO session_videos (session_id, title, description, video_url, size_bytes, order_index, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`,
		sessionID,
		finalTitle,
		descriptionInput,
		filePath,
		header.Size,
		maxOrder+1,
		time.Now(),
	)

	if err != nil {
		fmt.Println("Error upload video DB:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save video metadata"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Video uploaded successfully"})
}

// =======================================
// UPLOAD FILE MATERI KE SESI
// =======================================
func UploadSessionFile(c *gin.Context) {
	userID := c.GetInt64("user_id")
	sessionIDParam := c.Param("sessionID")

	var sessionID int64
	if _, err := fmt.Sscan(sessionIDParam, &sessionID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	// Cek Kepemilikan
	if !checkSessionOwnedByUser(sessionID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't own this session"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	ext := filepath.Ext(file.Filename)
	switch ext {
	case ".pdf", ".ppt", ".pptx", ".doc", ".docx":
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only pdf/ppt/pptx/doc/docx allowed"})
		return
	}

	titleInput := c.PostForm("title")
	descriptionInput := c.PostForm("description")

	finalTitle := titleInput
	if finalTitle == "" {
		finalTitle = file.Filename
	}

	filename := fmt.Sprintf("session_file_%d_%d%s", sessionID, time.Now().Unix(), ext)
	path := "uploads/files/" + filename

	os.MkdirAll("uploads/files", os.ModePerm)

	if err := c.SaveUploadedFile(file, path); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	var maxOrder int
	config.DB.Get(&maxOrder, `SELECT COALESCE(MAX(order_index), 0) FROM session_files WHERE session_id = ?`, sessionID)

	_, err = config.DB.Exec(`
		INSERT INTO session_files (session_id, title, description, file_url, size_bytes, order_index, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`,
		sessionID,
		finalTitle,
		descriptionInput,
		path,
		file.Size,
		maxOrder+1,
		time.Now(),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file metadata"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File uploaded successfully",
		"path":    path,
	})
}

// ============================================================
// ORGANIZATION VIEW: Melihat media milik sesi sendiri
// ============================================================
func GetSessionMedia(c *gin.Context) {
	userID := c.GetInt64("user_id")
	sessionIDStr := c.Param("sessionID")

	var sessionID int64
	if _, err := fmt.Sscan(sessionIDStr, &sessionID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	if !checkSessionOwnedByUser(sessionID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't own this session"})
		return
	}

	// Ambil Video
	var videos []models.SessionVideo
	err := config.DB.Select(&videos, `SELECT * FROM session_videos WHERE session_id = ? ORDER BY order_index ASC`, sessionID)
	if err != nil {
		videos = []models.SessionVideo{}
	}

	// Ambil File
	var files []models.SessionFile
	err = config.DB.Select(&files, `SELECT * FROM session_files WHERE session_id = ? ORDER BY order_index ASC`, sessionID)
	if err != nil {
		files = []models.SessionFile{}
	}

	c.JSON(http.StatusOK, gin.H{
		"videos": videos,
		"files":  files,
	})
}

// =======================================================================
// 4. USER VIEW: Mengakses media sesi jika sudah membeli sesi tersebut
// =======================================================================
func GetUserSessionMedia(c *gin.Context) {
	userID := c.GetInt64("user_id")
	sessionIDStr := c.Param("sessionID")

	var sessionID int64
	if _, err := fmt.Sscan(sessionIDStr, &sessionID); err != nil {
		c.JSON(400, gin.H{"error": "Invalid session ID"})
		return
	}

	// 1. Cek Pembelian
	var count int
	err := config.DB.Get(&count, `
		SELECT COUNT(*) FROM purchases 
		WHERE user_id = ? AND session_id = ?
	`, userID, sessionID)

	if err != nil || count == 0 {
		c.JSON(403, gin.H{"error": "You have not purchased this session"})
		return
	}

	// 2. Cek Status Publish Sesi
	var status string
	err = config.DB.Get(&status, `SELECT publish_status FROM sessions WHERE id = ?`, sessionID)

	if err != nil || status != "PUBLISHED" {
		c.JSON(403, gin.H{"error": "Session not accessible (not published)"})
		return
	}

	// 3. Ambil Video (FIX: Pakai COALESCE agar tidak error jika description NULL)
	var videos []models.SessionVideo
	err = config.DB.Select(&videos, `
		SELECT id, session_id, title, COALESCE(description, '') as description, video_url, size_bytes, order_index 
		FROM session_videos 
		WHERE session_id = ?
		ORDER BY order_index ASC
	`, sessionID)

	if err != nil {
		fmt.Println("❌ Error Fetching Videos:", err) // Debug di terminal
		videos = []models.SessionVideo{}
	}

	// 4. Ambil File (FIX: Pakai COALESCE juga)
	var files []models.SessionFile
	err = config.DB.Select(&files, `
		SELECT id, session_id, title, COALESCE(description, '') as description, file_url, size_bytes, order_index 
		FROM session_files 
		WHERE session_id = ?
		ORDER BY order_index ASC
	`, sessionID)

	if err != nil {
		fmt.Println("❌ Error Fetching Files:", err) // Debug di terminal
		files = []models.SessionFile{}
	}

	c.JSON(200, gin.H{
		"session_id": sessionID,
		"videos":     videos,
		"files":      files,
	})
}