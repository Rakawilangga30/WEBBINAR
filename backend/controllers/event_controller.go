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

// Helper
func getOrganizationIDByUser(userID int64) (int64, error) {
	var orgID int64
	err := config.DB.Get(&orgID, "SELECT id FROM organizations WHERE owner_user_id = ?", userID)
	return orgID, err
}

// Structs
type SessionVideoResponse struct {
	ID          int64  `db:"id" json:"id"`
	Title       string `db:"title" json:"title"`
	Description string `db:"description" json:"description"`
	VideoURL    string `db:"video_url" json:"video_url"`
}

type SessionFileResponse struct {
	ID          int64  `db:"id" json:"id"`
	Title       string `db:"title" json:"title"`
	Description string `db:"description" json:"description"`
	FileURL     string `db:"file_url" json:"file_url"`
}

type SessionWithMedia struct {
	ID            int64                  `db:"id" json:"id"`
	EventID       int64                  `db:"event_id" json:"event_id"`
	Title         string                 `db:"title" json:"title"`
	Description   string                 `db:"description" json:"description"`
	Price         int                    `db:"price" json:"price"`
	PublishStatus string                 `db:"publish_status" json:"publish_status"`
	Videos        []SessionVideoResponse `json:"videos"`
	Files         []SessionFileResponse  `json:"files"`
}

// GET DETAIL FOR MANAGE
func GetMyEventDetailForManage(c *gin.Context) {
	eventID := c.Param("eventID")
	userID := c.GetInt64("user_id")

	orgID, err := getOrganizationIDByUser(userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda belum terdaftar sebagai creator"})
		return
	}

	var event models.Event
	err = config.DB.Get(&event, `
		SELECT id, organization_id, title, description, category, thumbnail_url, COALESCE(publish_status, 'DRAFT') as publish_status, publish_at, created_at, updated_at
		FROM events WHERE id = ? AND organization_id = ?
	`, eventID, orgID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event tidak ditemukan"})
		return
	}

	var sessions []SessionWithMedia
	err = config.DB.Select(&sessions, `SELECT id, event_id, title, description, price, COALESCE(publish_status, 'DRAFT') as publish_status FROM sessions WHERE event_id = ? ORDER BY order_index ASC, created_at ASC`, eventID)
	if err != nil {
		sessions = []SessionWithMedia{}
	}

	for i := range sessions {
		var videos []SessionVideoResponse
		config.DB.Select(&videos, `SELECT id, title, COALESCE(description, '') as description, video_url FROM session_videos WHERE session_id = ? ORDER BY order_index ASC`, sessions[i].ID)
		if videos == nil {
			videos = []SessionVideoResponse{}
		}
		sessions[i].Videos = videos

		var files []SessionFileResponse
		config.DB.Select(&files, `SELECT id, title, COALESCE(description, '') as description, file_url FROM session_files WHERE session_id = ? ORDER BY order_index ASC`, sessions[i].ID)
		if files == nil {
			files = []SessionFileResponse{}
		}
		sessions[i].Files = files
	}

	c.JSON(http.StatusOK, gin.H{"event": event, "sessions": sessions})
}

// CREATE EVENT
type CreateEventRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

func CreateEvent(c *gin.Context) {
	userID := c.GetInt64("user_id")
	orgID, err := getOrganizationIDByUser(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}
	var req CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	res, err := config.DB.Exec(`INSERT INTO events (organization_id, title, description, category, publish_status, created_at, updated_at) VALUES (?, ?, ?, ?, 'DRAFT', ?, ?)`, orgID, req.Title, req.Description, req.Category, time.Now(), time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}
	eventID, _ := res.LastInsertId()
	c.JSON(http.StatusOK, gin.H{"message": "Event created", "event_id": eventID})
}

// LIST MY EVENTS
func ListMyEvents(c *gin.Context) {
	userID := c.GetInt64("user_id")
	orgID, err := getOrganizationIDByUser(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}
	var events []models.Event
	config.DB.Select(&events, `SELECT id, organization_id, title, description, category, thumbnail_url, COALESCE(publish_status, 'DRAFT') as publish_status, publish_at, created_at, updated_at FROM events WHERE organization_id = ? ORDER BY created_at DESC`, orgID)
	if events == nil {
		events = []models.Event{}
	}
	c.JSON(http.StatusOK, gin.H{"events": events})
}

// ==========================================
// DELETE EVENT (FIXED: Full Cleanup)
// ==========================================
func DeleteEvent(c *gin.Context) {
	eventID := c.Param("eventID")
	userID := c.GetInt64("user_id")

	orgID, err := getOrganizationIDByUser(userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	// 1. Ambil Info Thumbnail untuk dihapus nanti
	var thumbnailURL string
	err = config.DB.Get(&thumbnailURL, "SELECT COALESCE(thumbnail_url, '') FROM events WHERE id = ? AND organization_id = ?", eventID, orgID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event tidak ditemukan atau bukan milik Anda"})
		return
	}

	// 2. Ambil semua Session ID di event ini
	var sessionIDs []int64
	err = config.DB.Select(&sessionIDs, "SELECT id FROM sessions WHERE event_id = ?", eventID)

	if err == nil {
		for _, sessID := range sessionIDs {
			// A. Hapus Video (Supabase & DB)
			var videoPaths []string
			config.DB.Select(&videoPaths, "SELECT video_url FROM session_videos WHERE session_id = ?", sessID)
			for _, path := range videoPaths {
				if strings.Contains(path, "supabase") {
					utils.DeleteFromSupabase(utils.GetStoragePathFromURL(path))
				}
			}
			config.DB.Exec("DELETE FROM session_videos WHERE session_id = ?", sessID)

			// B. Hapus Files (Supabase & DB)
			var filePaths []string
			config.DB.Select(&filePaths, "SELECT file_url FROM session_files WHERE session_id = ?", sessID)
			for _, path := range filePaths {
				if strings.Contains(path, "supabase") {
					utils.DeleteFromSupabase(utils.GetStoragePathFromURL(path))
				}
			}
			config.DB.Exec("DELETE FROM session_files WHERE session_id = ?", sessID)

			// C. Hapus Purchases (DB)
			config.DB.Exec("DELETE FROM purchases WHERE session_id = ?", sessID)
		}

		// 3. Setelah isi sesi kosong, Hapus SEMUA SESI di event ini
		_, err := config.DB.Exec("DELETE FROM sessions WHERE event_id = ?", eventID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus sesi-sesi (DB Error): " + err.Error()})
			return
		}
	}

	// 4. Hapus Thumbnail Event dari Supabase
	if thumbnailURL != "" && strings.Contains(thumbnailURL, "supabase") {
		utils.DeleteFromSupabase(utils.GetStoragePathFromURL(thumbnailURL))
	}

	// 5. Akhirnya Hapus Event dari DB
	_, err = config.DB.Exec("DELETE FROM events WHERE id = ? AND organization_id = ?", eventID, orgID)

	if err != nil {
		fmt.Println("Error delete event:", err) // Menggunakan fmt yang sekarang sudah diimport
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus event (DB Error): " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event dan semua isinya berhasil dihapus"})
}

// ==========================================
// UPDATE EVENT (Title, Desc, Category)
// ==========================================
type UpdateEventInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

func UpdateEvent(c *gin.Context) {
	eventID := c.Param("eventID")
	userID := c.GetInt64("user_id")

	orgID, err := getOrganizationIDByUser(userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	// Cek kepemilikan
	var count int
	config.DB.Get(&count, "SELECT COUNT(*) FROM events WHERE id = ? AND organization_id = ?", eventID, orgID)
	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event tidak ditemukan atau bukan milik Anda"})
		return
	}

	var input UpdateEventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update DB
	_, err = config.DB.Exec(`
		UPDATE events 
		SET title = ?, description = ?, category = ?, updated_at = NOW() 
		WHERE id = ?
	`, input.Title, input.Description, input.Category, eventID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event berhasil diperbarui"})
}

// ==========================================
// UPLOAD EVENT THUMBNAIL
// ==========================================
func UploadEventThumbnail(c *gin.Context) {
	eventID := c.Param("eventID")
	userID := c.GetInt64("user_id")

	orgID, err := getOrganizationIDByUser(userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	// Cek kepemilikan
	var count int
	config.DB.Get(&count, "SELECT COUNT(*) FROM events WHERE id = ? AND organization_id = ?", eventID, orgID)
	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event tidak ditemukan atau bukan milik Anda"})
		return
	}

	// Ambil File
	fileHeader, err := c.FormFile("thumbnail")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File thumbnail wajib diupload"})
		return
	}

	ext := filepath.Ext(fileHeader.Filename)
	filename := fmt.Sprintf("event_thumb_%s_%d%s", eventID, time.Now().Unix(), ext)
	storagePath := "events/" + filename

	publicURL, err := utils.UploadFileHeaderToSupabase(storagePath, fileHeader)
	if err != nil {
		fmt.Printf("❌ Supabase upload error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal upload gambar"})
		return
	}

	// Update DB with Supabase URL
	_, err = config.DB.Exec("UPDATE events SET thumbnail_url = ? WHERE id = ?", publicURL, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Thumbnail berhasil diupload",
		"thumbnail_url": publicURL,
	})
}
