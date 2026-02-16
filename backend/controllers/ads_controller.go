package controllers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"BACKEND/config"
	"BACKEND/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ===============================================
// AD BANNERS MANAGEMENT (Admin)
// ===============================================

// GetAllAds - List all ad banners (Admin)
// GET /admin/ads
func GetAllAds(c *gin.Context) {
	var ads []struct {
		ID         int64      `db:"id" json:"id"`
		Title      string     `db:"title" json:"title"`
		ImageURL   string     `db:"image_url" json:"image_url"`
		TargetURL  *string    `db:"target_url" json:"target_url"`
		Placement  string     `db:"placement" json:"placement"`
		StartDate  *time.Time `db:"start_date" json:"start_date"`
		EndDate    *time.Time `db:"end_date" json:"end_date"`
		IsActive   bool       `db:"is_active" json:"is_active"`
		OrderIndex int        `db:"order_index" json:"order_index"`
		CreatedAt  time.Time  `db:"created_at" json:"created_at"`
	}

	err := config.DB.Select(&ads, `
		SELECT id, title, image_url, target_url, placement, 
			start_date, end_date, is_active, order_index, created_at
		FROM ad_banners
		ORDER BY placement, order_index, created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get ads"})
		return
	}

	if ads == nil {
		ads = []struct {
			ID         int64      `db:"id" json:"id"`
			Title      string     `db:"title" json:"title"`
			ImageURL   string     `db:"image_url" json:"image_url"`
			TargetURL  *string    `db:"target_url" json:"target_url"`
			Placement  string     `db:"placement" json:"placement"`
			StartDate  *time.Time `db:"start_date" json:"start_date"`
			EndDate    *time.Time `db:"end_date" json:"end_date"`
			IsActive   bool       `db:"is_active" json:"is_active"`
			OrderIndex int        `db:"order_index" json:"order_index"`
			CreatedAt  time.Time  `db:"created_at" json:"created_at"`
		}{}
	}

	c.JSON(http.StatusOK, ads)
}

// CreateAdBanner - Create new ad banner
// POST /admin/ads
func CreateAdBanner(c *gin.Context) {
	userID := c.GetInt64("user_id")

	title := c.PostForm("title")
	targetURL := c.PostForm("target_url")
	placement := c.PostForm("placement")
	startDate := c.PostForm("start_date")
	endDate := c.PostForm("end_date")

	if title == "" || placement == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title dan placement diperlukan"})
		return
	}

	// Validate placement
	validPlacements := map[string]bool{
		"BANNER_SLIDER": true,
		"SIDEBAR_LEFT":  true,
		"SIDEBAR_RIGHT": true,
		"HERO_SECTION":  true,
	}
	if !validPlacements[placement] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "placement harus BANNER_SLIDER, SIDEBAR_LEFT, SIDEBAR_RIGHT, atau HERO_SECTION"})
		return
	}

	// Handle image upload
	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file diperlukan"})
		return
	}

	// Upload to Supabase
	ext := filepath.Ext(fileHeader.Filename)
	filename := fmt.Sprintf("ad_%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
	storagePath := "ads/" + filename

	publicURL, err := utils.UploadFileHeaderToSupabase(storagePath, fileHeader)
	if err != nil {
		fmt.Printf("❌ Supabase upload error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal upload gambar"})
		return
	}

	// Insert to DB
	var startDateSQL, endDateSQL interface{}
	if startDate != "" {
		startDateSQL = startDate
	}
	if endDate != "" {
		endDateSQL = endDate
	}

	result, err := config.DB.Exec(`
		INSERT INTO ad_banners (title, image_url, target_url, placement, start_date, end_date, created_by)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, title, publicURL, targetURL, placement, startDateSQL, endDateSQL, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat banner: " + err.Error()})
		return
	}

	adID, _ := result.LastInsertId()
	c.JSON(http.StatusOK, gin.H{
		"message": "Banner berhasil dibuat",
		"id":      adID,
	})
}

// UpdateAdBanner - Update ad banner
// PUT /admin/ads/:id
func UpdateAdBanner(c *gin.Context) {
	adID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	title := c.PostForm("title")
	targetURL := c.PostForm("target_url")
	placement := c.PostForm("placement")
	startDate := c.PostForm("start_date")
	endDate := c.PostForm("end_date")
	isActive := c.PostForm("is_active")
	orderIndex := c.PostForm("order_index")

	// Check if exists
	var exists int
	config.DB.Get(&exists, "SELECT COUNT(*) FROM ad_banners WHERE id = ?", adID)
	if exists == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Banner tidak ditemukan"})
		return
	}

	// Handle image update if provided
	fileHeader, err := c.FormFile("image")
	if err == nil && fileHeader != nil {
		ext := filepath.Ext(fileHeader.Filename)
		filename := fmt.Sprintf("ad_%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
		storagePath := "ads/" + filename

		publicURL, uploadErr := utils.UploadFileHeaderToSupabase(storagePath, fileHeader)
		if uploadErr == nil {
			config.DB.Exec("UPDATE ad_banners SET image_url = ? WHERE id = ?", publicURL, adID)
		}
	}

	// Update other fields
	if title != "" {
		config.DB.Exec("UPDATE ad_banners SET title = ? WHERE id = ?", title, adID)
	}
	if targetURL != "" {
		config.DB.Exec("UPDATE ad_banners SET target_url = ? WHERE id = ?", targetURL, adID)
	}
	if placement != "" {
		config.DB.Exec("UPDATE ad_banners SET placement = ? WHERE id = ?", placement, adID)
	}
	if startDate != "" {
		config.DB.Exec("UPDATE ad_banners SET start_date = ? WHERE id = ?", startDate, adID)
	}
	if endDate != "" {
		config.DB.Exec("UPDATE ad_banners SET end_date = ? WHERE id = ?", endDate, adID)
	}
	if isActive != "" {
		active := isActive == "true" || isActive == "1"
		config.DB.Exec("UPDATE ad_banners SET is_active = ? WHERE id = ?", active, adID)
	}
	if orderIndex != "" {
		order, _ := strconv.Atoi(orderIndex)
		config.DB.Exec("UPDATE ad_banners SET order_index = ? WHERE id = ?", order, adID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Banner berhasil diupdate"})
}

// DeleteAdBanner - Delete ad banner
// DELETE /admin/ads/:id
func DeleteAdBanner(c *gin.Context) {
	adID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	// Get image path for cleanup
	var imagePath string
	config.DB.Get(&imagePath, "SELECT image_url FROM ad_banners WHERE id = ?", adID)

	result, _ := config.DB.Exec("DELETE FROM ad_banners WHERE id = ?", adID)
	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Banner tidak ditemukan"})
		return
	}

	// Remove image from Supabase
	if imagePath != "" && strings.Contains(imagePath, "supabase") {
		utils.DeleteFromSupabase(utils.GetStoragePathFromURL(imagePath))
	}

	c.JSON(http.StatusOK, gin.H{"message": "Banner berhasil dihapus"})
}

// ===============================================
// PUBLIC ADS API
// ===============================================

// GetPublicAds - Get active ads by placement
// GET /api/ads?placement=HOME_SLIDER
func GetPublicAds(c *gin.Context) {
	placement := c.Query("placement")

	query := `
		SELECT id, title, image_url, target_url, placement, order_index
		FROM ad_banners
		WHERE is_active = 1
		AND (start_date IS NULL OR start_date <= CURDATE())
		AND (end_date IS NULL OR end_date >= CURDATE())
	`
	args := []interface{}{}

	if placement != "" {
		query += " AND placement = ?"
		args = append(args, placement)
	}

	query += " ORDER BY order_index, created_at DESC"

	var ads []struct {
		ID         int64   `db:"id" json:"id"`
		Title      string  `db:"title" json:"title"`
		ImageURL   string  `db:"image_url" json:"image_url"`
		TargetURL  *string `db:"target_url" json:"target_url"`
		Placement  string  `db:"placement" json:"placement"`
		OrderIndex int     `db:"order_index" json:"order_index"`
	}

	err := config.DB.Select(&ads, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get ads"})
		return
	}

	if ads == nil {
		ads = []struct {
			ID         int64   `db:"id" json:"id"`
			Title      string  `db:"title" json:"title"`
			ImageURL   string  `db:"image_url" json:"image_url"`
			TargetURL  *string `db:"target_url" json:"target_url"`
			Placement  string  `db:"placement" json:"placement"`
			OrderIndex int     `db:"order_index" json:"order_index"`
		}{}
	}

	c.JSON(http.StatusOK, ads)
}
