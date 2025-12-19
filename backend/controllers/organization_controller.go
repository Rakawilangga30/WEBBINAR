package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
)

// =============================
// USER APPLY ORGANIZATION
// =============================

type ApplyOrganizationRequest struct {
	OrgName        string `json:"org_name" binding:"required"`
	OrgDescription string `json:"org_description"`
	OrgCategory    string `json:"org_category"`
	OrgLogoURL     string `json:"org_logo_url"`

	OrgEmail   string `json:"org_email"`
	OrgPhone   string `json:"org_phone"`
	OrgWebsite string `json:"org_website"`

	Reason      string `json:"reason" binding:"required"`
	SocialMedia string `json:"social_media"`
}

func ApplyOrganization(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// 1. Check apakah user sudah pernah mengajukan
	var count int
	config.DB.Get(&count,
		"SELECT COUNT(*) FROM organization_applications WHERE user_id = ? AND status = 'PENDING'",
		userID,
	)

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have a pending application"})
		return
	}

	// 2. Bind JSON request
	var req ApplyOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	// 3. Insert into database
	_, err := config.DB.Exec(`
		INSERT INTO organization_applications 
		(user_id, org_name, org_description, org_category, org_logo_url, 
		 org_email, org_phone, org_website, reason, social_media, submitted_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`,
		userID,
		req.OrgName,
		req.OrgDescription,
		req.OrgCategory,
		req.OrgLogoURL,
		req.OrgEmail,
		req.OrgPhone,
		req.OrgWebsite,
		req.Reason,
		req.SocialMedia,
		time.Now(),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit application"})
		return
	}

	// 4. Return success
	c.JSON(http.StatusOK, gin.H{
		"message": "Organization application submitted successfully",
	})
}

// Struktur Request untuk Sesi
type CreateSessionRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Price       int64  `json:"price"`
}

// =======================================
// ORGANIZATION: CREATE SESSION
// =======================================
func CreateSession(c *gin.Context) {
	eventID := c.Param("eventID")

	userID := c.GetInt64("user_id")
	orgID, err := getOrganizationIDByUser(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization"})
		return
	}

	// Cek kepemilikan event
	var count int
	config.DB.Get(&count, "SELECT COUNT(*) FROM events WHERE id = ? AND organization_id = ?", eventID, orgID)
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Event not found or access denied"})
		return
	}

	var req CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var maxOrder int
	config.DB.Get(&maxOrder, "SELECT COALESCE(MAX(order_index), 0) FROM sessions WHERE event_id = ?", eventID)

	res, err := config.DB.Exec(`
		INSERT INTO sessions (event_id, title, description, price, order_index, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`,
		eventID, req.Title, req.Description, req.Price, maxOrder+1, time.Now(),
	)

	if err != nil {
		fmt.Println("❌ Error Create Session:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat sesi"})
		return
	}

	sessionID, _ := res.LastInsertId()
	c.JSON(http.StatusOK, gin.H{"message": "Session created!", "session_id": sessionID})
}

// =======================================
// UPDATE EVENT (Title, Desc, Category)
// =======================================
func UpdateEvent(c *gin.Context) {
	// 1. Ambil ID dari param dan user_id dari token
	eventIDStr := c.Param("eventID") // perhatikan nama param di route nanti
	userID := c.GetInt64("user_id")

	var eventID int64
	if _, err := fmt.Sscan(eventIDStr, &eventID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	// 2. Cek Kepemilikan Event
	// Kita pastikan event ini milik organization yang dimiliki user ini
	var count int
	err := config.DB.Get(&count, `
		SELECT COUNT(*) 
		FROM events e
		JOIN organizations o ON e.organization_id = o.id
		WHERE e.id = ? AND o.owner_user_id = ?
	`, eventID, userID)

	if err != nil || count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to edit this event"})
		return
	}

	// 3. Tangkap Input JSON
	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Category    string `json:"category"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 4. Lakukan Update
	// Kita hanya update field yang relevan. Publish status tidak diubah disini.
	_, err = config.DB.Exec(`
		UPDATE events 
		SET title = ?, description = ?, category = ?, updated_at = ?
		WHERE id = ?
	`, input.Title, input.Description, input.Category, time.Now(), eventID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Event updated successfully",
		"data":    input,
	})
}

// =======================================
// UPLOAD EVENT THUMBNAIL
// =======================================
func UploadEventThumbnail(c *gin.Context) {
	// 1. Ambil ID Event
	eventIDStr := c.Param("eventID")
	userID := c.GetInt64("user_id")

	var eventID int64
	if _, err := fmt.Sscan(eventIDStr, &eventID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	// 2. Cek Kepemilikan (PENTING)
	var count int
	err := config.DB.Get(&count, `
		SELECT COUNT(*) FROM events e
		JOIN organizations o ON e.organization_id = o.id
		WHERE e.id = ? AND o.owner_user_id = ?
	`, eventID, userID)

	if err != nil || count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to edit this event"})
		return
	}

	// 3. Ambil File dari Form
	file, err := c.FormFile("thumbnail")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Thumbnail file is required"})
		return
	}

	// Validasi Ekstensi (Hanya Gambar)
	ext := filepath.Ext(file.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only jpg, jpeg, and png allowed"})
		return
	}

	// 4. Simpan File
	// Format nama: event_thumb_{id}_{timestamp}.jpg
	filename := fmt.Sprintf("event_thumb_%d_%d%s", eventID, time.Now().Unix(), ext)
	savePath := "uploads/events/" + filename

	// Pastikan folder ada
	os.MkdirAll("uploads/events", os.ModePerm)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save thumbnail image"})
		return
	}

	// 5. Update Database
	// Kita simpan path-nya saja
	_, err = config.DB.Exec("UPDATE events SET thumbnail_url = ? WHERE id = ?", savePath, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Thumbnail updated successfully",
		"thumbnail_url": savePath,
	})
}
