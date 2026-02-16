package controllers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
	"BACKEND/models"
	"BACKEND/utils"
)

// NOTE: Fungsi checkSessionOwnedByUser diasumsikan ada di helpers.go

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

	if !checkSessionOwnedByUser(sessionID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't own this session"})
		return
	}

	fileHeader, err := c.FormFile("video")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Video file is required"})
		return
	}

	titleInput := c.PostForm("title")
	descriptionInput := c.PostForm("description")

	finalTitle := titleInput
	if finalTitle == "" {
		finalTitle = fileHeader.Filename
	}

	ext := filepath.Ext(fileHeader.Filename)
	uniqueName := fmt.Sprintf("session_%d_%d%s", sessionID, time.Now().Unix(), ext)
	storagePath := "videos/" + uniqueName

	publicURL, err := utils.UploadFileHeaderToSupabase(storagePath, fileHeader)
	if err != nil {
		fmt.Printf("[UPLOAD_VIDEO_ERROR] Supabase upload: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload video"})
		return
	}

	var maxOrder int
	config.DB.Get(&maxOrder, "SELECT COALESCE(MAX(order_index), 0) FROM session_videos WHERE session_id = ?", sessionID)

	_, err = config.DB.Exec(`
		INSERT INTO session_videos (session_id, title, description, video_url, size_bytes, order_index, created_at)
		VALUES (?, ?, ?, ?, ?, ?, NOW())
	`, sessionID, finalTitle, descriptionInput, publicURL, fileHeader.Size, maxOrder+1)

	if err != nil {
		fmt.Printf("[UPLOAD_VIDEO_ERROR] Failed to insert: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save video metadata: " + err.Error()})
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

	if !checkSessionOwnedByUser(sessionID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't own this session"})
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	ext := filepath.Ext(fileHeader.Filename)
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
		finalTitle = fileHeader.Filename
	}

	filename := fmt.Sprintf("session_file_%d_%d%s", sessionID, time.Now().Unix(), ext)
	storagePath := "files/" + filename

	publicURL, err := utils.UploadFileHeaderToSupabase(storagePath, fileHeader)
	if err != nil {
		fmt.Printf("[UPLOAD_FILE_ERROR] Supabase upload: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file"})
		return
	}

	var maxOrder int
	config.DB.Get(&maxOrder, `SELECT COALESCE(MAX(order_index), 0) FROM session_files WHERE session_id = ?`, sessionID)

	_, err = config.DB.Exec(`
		INSERT INTO session_files (session_id, title, description, file_url, size_bytes, order_index, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
	`, sessionID, finalTitle, descriptionInput, publicURL, fileHeader.Size, maxOrder+1, time.Now())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file metadata"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File uploaded successfully", "url": publicURL})
}

// =======================================
// UPDATE VIDEO
// =======================================
func UpdateSessionVideo(c *gin.Context) {
	userID := c.GetInt64("user_id")
	sessionIDStr := c.Param("sessionID")
	mediaIDStr := c.Param("mediaID")

	var sessionID, mediaID int64
	fmt.Sscan(sessionIDStr, &sessionID)
	fmt.Sscan(mediaIDStr, &mediaID)

	if !checkSessionOwnedByUser(sessionID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't own this session"})
		return
	}

	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := config.DB.Exec(`UPDATE session_videos SET title=?, description=? WHERE id=? AND session_id=?`,
		input.Title, input.Description, mediaID, sessionID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update video info"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Video info updated"})
}

// =======================================
// UPDATE FILE
// =======================================
func UpdateSessionFile(c *gin.Context) {
	userID := c.GetInt64("user_id")
	sessionIDStr := c.Param("sessionID")
	mediaIDStr := c.Param("mediaID")

	var sessionID, mediaID int64
	fmt.Sscan(sessionIDStr, &sessionID)
	fmt.Sscan(mediaIDStr, &mediaID)

	if !checkSessionOwnedByUser(sessionID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't own this session"})
		return
	}

	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := config.DB.Exec(`UPDATE session_files SET title=?, description=? WHERE id=? AND session_id=?`,
		input.Title, input.Description, mediaID, sessionID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update file info"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "File info updated"})
}

// =======================================
// DELETE VIDEO (BARU)
// =======================================
func DeleteSessionVideo(c *gin.Context) {
	userID := c.GetInt64("user_id")
	sessionIDStr := c.Param("sessionID")
	mediaIDStr := c.Param("mediaID")

	var sessionID, mediaID int64
	fmt.Sscan(sessionIDStr, &sessionID)
	fmt.Sscan(mediaIDStr, &mediaID)

	if !checkSessionOwnedByUser(sessionID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses Ditolak"})
		return
	}

	// 1. Ambil Path File
	var videoPath string
	err := config.DB.Get(&videoPath, "SELECT video_url FROM session_videos WHERE id = ? AND session_id = ?", mediaID, sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video tidak ditemukan"})
		return
	}

	// 2. Hapus File dari Supabase
	if videoPath != "" && strings.Contains(videoPath, "supabase") {
		sp := utils.GetStoragePathFromURL(videoPath)
		utils.DeleteFromSupabase(sp)
	}

	// 3. Hapus Record DB
	_, err = config.DB.Exec("DELETE FROM session_videos WHERE id = ?", mediaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data video"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Video berhasil dihapus"})
}

// =======================================
// DELETE FILE (BARU)
// =======================================
func DeleteSessionFile(c *gin.Context) {
	userID := c.GetInt64("user_id")
	sessionIDStr := c.Param("sessionID")
	mediaIDStr := c.Param("mediaID")

	var sessionID, mediaID int64
	fmt.Sscan(sessionIDStr, &sessionID)
	fmt.Sscan(mediaIDStr, &mediaID)

	if !checkSessionOwnedByUser(sessionID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses Ditolak"})
		return
	}

	// 1. Ambil Path File
	var filePath string
	err := config.DB.Get(&filePath, "SELECT file_url FROM session_files WHERE id = ? AND session_id = ?", mediaID, sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File tidak ditemukan"})
		return
	}

	// 2. Hapus File dari Supabase
	if filePath != "" && strings.Contains(filePath, "supabase") {
		sp := utils.GetStoragePathFromURL(filePath)
		utils.DeleteFromSupabase(sp)
	}

	// 3. Hapus Record DB
	_, err = config.DB.Exec("DELETE FROM session_files WHERE id = ?", mediaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File berhasil dihapus"})
}

// ... (GET MEDIA FUNCTIONS tetap sama, tidak perlu diubah) ...
// (Pastikan GetSessionMedia dan GetUserSessionMedia tetap ada di bawah sini seperti kode sebelumnya)
func GetSessionMedia(c *gin.Context) {
	userID := c.GetInt64("user_id")
	sessionIDStr := c.Param("sessionID")
	var sessionID int64
	fmt.Sscan(sessionIDStr, &sessionID)
	if !checkSessionOwnedByUser(sessionID, userID) {
		c.JSON(403, gin.H{"error": "Access Denied"})
		return
	}
	var videos []models.SessionVideo
	config.DB.Select(&videos, `SELECT id, session_id, title, COALESCE(description, '') as description, video_url FROM session_videos WHERE session_id = ? ORDER BY order_index ASC`, sessionID)
	if videos == nil {
		videos = []models.SessionVideo{}
	}
	var files []models.SessionFile
	config.DB.Select(&files, `SELECT id, session_id, title, COALESCE(description, '') as description, file_url FROM session_files WHERE session_id = ? ORDER BY order_index ASC`, sessionID)
	if files == nil {
		files = []models.SessionFile{}
	}
	c.JSON(200, gin.H{"videos": videos, "files": files})
}

func GetUserSessionMedia(c *gin.Context) {
	userID := c.GetInt64("user_id")
	sessionIDStr := c.Param("sessionID")
	var sessionID int64
	fmt.Sscan(sessionIDStr, &sessionID)
	var count int
	config.DB.Get(&count, `SELECT COUNT(*) FROM purchases WHERE user_id = ? AND session_id = ?`, userID, sessionID)
	if count == 0 {
		c.JSON(403, gin.H{"error": "Not Purchased"})
		return
	}
	var status string
	config.DB.Get(&status, `SELECT publish_status FROM sessions WHERE id = ?`, sessionID)
	if status != "PUBLISHED" {
		c.JSON(403, gin.H{"error": "Not Published"})
		return
	}
	var videos []models.SessionVideo
	config.DB.Select(&videos, `SELECT id, session_id, title, COALESCE(description, '') as description, video_url FROM session_videos WHERE session_id = ? ORDER BY order_index ASC`, sessionID)
	if videos == nil {
		videos = []models.SessionVideo{}
	}
	var files []models.SessionFile
	config.DB.Select(&files, `SELECT id, session_id, title, COALESCE(description, '') as description, file_url FROM session_files WHERE session_id = ? ORDER BY order_index ASC`, sessionID)
	if files == nil {
		files = []models.SessionFile{}
	}
	c.JSON(200, gin.H{"session_id": sessionID, "videos": videos, "files": files})
}
