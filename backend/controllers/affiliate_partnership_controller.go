package controllers

import (
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"BACKEND/config"

	"github.com/gin-gonic/gin"
)

// ===============================================
// AFFILIATE PARTNERSHIP - NEW FLOW
// User joins to promote organization's event
// ===============================================

// JoinAffiliateEvent - User requests to join as affiliate for an event
// POST /affiliate/join/:eventId
func JoinAffiliateEvent(c *gin.Context) {
	userID := c.GetInt64("user_id")
	eventID, err := strconv.ParseInt(c.Param("eventId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	// Check profile completeness - user must complete profile first
	var profile struct {
		Name      string  `db:"name"`
		Phone     *string `db:"phone"`
		Address   *string `db:"address"`
		Gender    *string `db:"gender"`
		Birthdate *string `db:"birthdate"`
	}
	config.DB.Get(&profile, "SELECT name, phone, address, gender, birthdate FROM users WHERE id = ?", userID)

	var missingFields []string
	if profile.Name == "" {
		missingFields = append(missingFields, "nama")
	}
	if profile.Phone == nil || *profile.Phone == "" {
		missingFields = append(missingFields, "nomor telepon")
	}
	if profile.Address == nil || *profile.Address == "" {
		missingFields = append(missingFields, "alamat")
	}
	if profile.Gender == nil || *profile.Gender == "" {
		missingFields = append(missingFields, "jenis kelamin")
	}
	if profile.Birthdate == nil || *profile.Birthdate == "" {
		missingFields = append(missingFields, "tanggal lahir")
	}

	if len(missingFields) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":              "Lengkapi profil Anda terlebih dahulu sebelum menjadi affiliate",
			"missing_fields":     missingFields,
			"profile_incomplete": true,
		})
		return
	}

	// Parse input
	var input struct {
		BankName        string `json:"bank_name" binding:"required"`
		BankAccount     string `json:"bank_account" binding:"required"`
		BankAccountName string `json:"bank_account_name" binding:"required"`
		SocialMedia     string `json:"social_media" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lengkapi semua data: nama bank, nomor rekening, atas nama, dan media sosial"})
		return
	}

	// Check if event exists and get org info
	var eventInfo struct {
		ID             int64  `db:"id"`
		Title          string `db:"title"`
		OrganizationID int64  `db:"organization_id"`
		IsOfficial     bool   `db:"is_official"`
	}
	err = config.DB.Get(&eventInfo, `
		SELECT e.id, e.title, e.organization_id, COALESCE(o.is_official, 0) as is_official
		FROM events e
		JOIN organizations o ON e.organization_id = o.id
		WHERE e.id = ? AND e.publish_status = 'PUBLISHED'
	`, eventID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event tidak ditemukan atau belum dipublish"})
		return
	}

	// Official org events cannot have affiliates
	if eventInfo.IsOfficial {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event official tidak bisa dipromosikan affiliate"})
		return
	}

	// Anti-spam: Check if user sent any request in last 24 hours
	var lastRequestTime *time.Time
	config.DB.Get(&lastRequestTime, `
		SELECT created_at FROM affiliate_partnerships 
		WHERE user_id = ? 
		ORDER BY created_at DESC LIMIT 1
	`, userID)
	if lastRequestTime != nil && time.Since(*lastRequestTime) < 24*time.Hour {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "Anda hanya bisa mengirim 1 permintaan per 24 jam. Coba lagi besok."})
		return
	}

	// Check if user already joined this event
	var existingCount int
	config.DB.Get(&existingCount, `
		SELECT COUNT(*) FROM affiliate_partnerships 
		WHERE user_id = ? AND event_id = ?
	`, userID, eventID)
	if existingCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah mendaftar sebagai affiliate untuk event ini"})
		return
	}

	// Check if user is the org owner (cannot be affiliate of own event)
	var orgOwnerID int64
	config.DB.Get(&orgOwnerID, "SELECT owner_user_id FROM organizations WHERE id = ?", eventInfo.OrganizationID)
	if orgOwnerID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda tidak bisa menjadi affiliate untuk event sendiri"})
		return
	}

	// Get user phone from profile
	var userPhone string
	config.DB.Get(&userPhone, "SELECT COALESCE(phone, '') FROM users WHERE id = ?", userID)

	// Generate temporary unique code (will be finalized on approval)
	tempCode := generateAffiliateCode(eventInfo.Title, userID)

	// Insert partnership request with all data
	_, err = config.DB.Exec(`
		INSERT INTO affiliate_partnerships (user_id, event_id, organization_id, unique_code, phone, bank_name, bank_account, bank_account_name, social_media, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
	`, userID, eventID, eventInfo.OrganizationID, tempCode, userPhone, input.BankName, input.BankAccount, input.BankAccountName, input.SocialMedia)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mendaftar affiliate: " + err.Error()})
		return
	}

	// Notify org owner
	CreateNotification(
		orgOwnerID,
		"affiliate_request",
		"👥 Permintaan Affiliate Baru",
		fmt.Sprintf("Ada user baru yang ingin menjadi affiliate untuk event \"%s\"", eventInfo.Title),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Permintaan affiliate berhasil dikirim. Menunggu persetujuan organisasi.",
	})
}

// GetMyPartnerships - Get all affiliate partnerships for current user
// GET /affiliate/partnerships
func GetMyPartnerships(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var partnerships []struct {
		ID                   int64      `db:"id" json:"id"`
		EventID              int64      `db:"event_id" json:"event_id"`
		EventTitle           string     `db:"event_title" json:"event_title"`
		OrganizationName     string     `db:"organization_name" json:"organization_name"`
		UniqueCode           string     `db:"unique_code" json:"unique_code"`
		CommissionPercentage float64    `db:"commission_percentage" json:"commission_percentage"`
		Status               string     `db:"status" json:"status"`
		CreatedAt            time.Time  `db:"created_at" json:"created_at"`
		ApprovedAt           *time.Time `db:"approved_at" json:"approved_at"`
	}

	err := config.DB.Select(&partnerships, `
		SELECT ap.id, ap.event_id, e.title as event_title, 
			o.name as organization_name, ap.unique_code,
			ap.commission_percentage, ap.status, ap.created_at, ap.approved_at
		FROM affiliate_partnerships ap
		JOIN events e ON ap.event_id = e.id
		JOIN organizations o ON ap.organization_id = o.id
		WHERE ap.user_id = ?
		ORDER BY ap.created_at DESC
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get partnerships"})
		return
	}

	if partnerships == nil {
		partnerships = []struct {
			ID                   int64      `db:"id" json:"id"`
			EventID              int64      `db:"event_id" json:"event_id"`
			EventTitle           string     `db:"event_title" json:"event_title"`
			OrganizationName     string     `db:"organization_name" json:"organization_name"`
			UniqueCode           string     `db:"unique_code" json:"unique_code"`
			CommissionPercentage float64    `db:"commission_percentage" json:"commission_percentage"`
			Status               string     `db:"status" json:"status"`
			CreatedAt            time.Time  `db:"created_at" json:"created_at"`
			ApprovedAt           *time.Time `db:"approved_at" json:"approved_at"`
		}{}
	}

	c.JSON(http.StatusOK, partnerships)
}

// ===============================================
// ORGANIZATION - MANAGE AFFILIATE REQUESTS
// ===============================================

// GetAffiliateRequests - Get pending affiliate requests for org's events
// GET /organization/affiliate-requests
func GetAffiliateRequests(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Get org ID owned by user
	var orgID int64
	err := config.DB.Get(&orgID, "SELECT id FROM organizations WHERE owner_user_id = ?", userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organisasi tidak ditemukan"})
		return
	}

	var requests []struct {
		ID                   int64     `db:"id" json:"id"`
		UserID               int64     `db:"user_id" json:"user_id"`
		UserName             string    `db:"user_name" json:"user_name"`
		UserEmail            string    `db:"user_email" json:"user_email"`
		UserPhone            *string   `db:"user_phone" json:"user_phone"`
		EventID              int64     `db:"event_id" json:"event_id"`
		EventTitle           string    `db:"event_title" json:"event_title"`
		UniqueCode           string    `db:"unique_code" json:"unique_code"`
		CommissionPercentage float64   `db:"commission_percentage" json:"commission_percentage"`
		Phone                *string   `db:"phone" json:"phone"`
		BankName             *string   `db:"bank_name" json:"bank_name"`
		BankAccount          *string   `db:"bank_account" json:"bank_account"`
		BankAccountName      *string   `db:"bank_account_name" json:"bank_account_name"`
		SocialMedia          *string   `db:"social_media" json:"social_media"`
		Status               string    `db:"status" json:"status"`
		CreatedAt            time.Time `db:"created_at" json:"created_at"`
	}

	err = config.DB.Select(&requests, `
		SELECT ap.id, ap.user_id, u.name as user_name, u.email as user_email, u.phone as user_phone,
			ap.event_id, e.title as event_title, ap.unique_code, ap.commission_percentage,
			ap.phone, ap.bank_name, ap.bank_account, ap.bank_account_name, ap.social_media,
			ap.status, ap.created_at
		FROM affiliate_partnerships ap
		JOIN users u ON ap.user_id = u.id
		JOIN events e ON ap.event_id = e.id
		WHERE ap.organization_id = ?
		ORDER BY ap.status = 'PENDING' DESC, ap.created_at DESC
	`, orgID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get requests: " + err.Error()})
		return
	}

	if requests == nil {
		requests = make([]struct {
			ID                   int64     `db:"id" json:"id"`
			UserID               int64     `db:"user_id" json:"user_id"`
			UserName             string    `db:"user_name" json:"user_name"`
			UserEmail            string    `db:"user_email" json:"user_email"`
			UserPhone            *string   `db:"user_phone" json:"user_phone"`
			EventID              int64     `db:"event_id" json:"event_id"`
			EventTitle           string    `db:"event_title" json:"event_title"`
			UniqueCode           string    `db:"unique_code" json:"unique_code"`
			CommissionPercentage float64   `db:"commission_percentage" json:"commission_percentage"`
			Phone                *string   `db:"phone" json:"phone"`
			BankName             *string   `db:"bank_name" json:"bank_name"`
			BankAccount          *string   `db:"bank_account" json:"bank_account"`
			BankAccountName      *string   `db:"bank_account_name" json:"bank_account_name"`
			SocialMedia          *string   `db:"social_media" json:"social_media"`
			Status               string    `db:"status" json:"status"`
			CreatedAt            time.Time `db:"created_at" json:"created_at"`
		}, 0)
	}

	c.JSON(http.StatusOK, requests)
}

// ApproveAffiliateRequest - Approve affiliate and set commission
// PUT /organization/affiliate-requests/:id/approve
func ApproveAffiliateRequest(c *gin.Context) {
	userID := c.GetInt64("user_id")
	requestID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	var input struct {
		CommissionPercentage float64 `json:"commission_percentage"`
		UniqueCode           string  `json:"unique_code"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		// Default 10% if not specified
		input.CommissionPercentage = 10.0
	}
	if input.CommissionPercentage < 1 || input.CommissionPercentage > 50 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Komisi harus antara 1% - 50%"})
		return
	}

	// Check ownership
	var orgID int64
	config.DB.Get(&orgID, "SELECT id FROM organizations WHERE owner_user_id = ?", userID)

	// Get partnership info
	var partnership struct {
		ID             int64  `db:"id"`
		UserID         int64  `db:"user_id"`
		EventID        int64  `db:"event_id"`
		OrganizationID int64  `db:"organization_id"`
		Status         string `db:"status"`
	}
	err = config.DB.Get(&partnership, "SELECT id, user_id, event_id, organization_id, status FROM affiliate_partnerships WHERE id = ?", requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request tidak ditemukan"})
		return
	}

	if partnership.OrganizationID != orgID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki akses ke request ini"})
		return
	}

	if partnership.Status != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request sudah diproses sebelumnya"})
		return
	}

	// Get event title for code generation
	var eventTitle string
	config.DB.Get(&eventTitle, "SELECT title FROM events WHERE id = ?", partnership.EventID)

	// Use custom code or generate one
	finalCode := strings.TrimSpace(input.UniqueCode)
	if finalCode == "" {
		finalCode = generateAffiliateCode(eventTitle, partnership.UserID)
	} else {
		// Check if custom code already exists
		var existingCount int
		config.DB.Get(&existingCount, "SELECT COUNT(*) FROM affiliate_partnerships WHERE unique_code = ? AND id != ?", finalCode, requestID)
		if existingCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode unik sudah digunakan, pilih kode lain"})
			return
		}
	}

	// Update partnership
	_, err = config.DB.Exec(`
		UPDATE affiliate_partnerships 
		SET status = 'APPROVED', 
			commission_percentage = ?,
			unique_code = ?,
			approved_at = NOW(),
			approved_by = ?
		WHERE id = ?
	`, input.CommissionPercentage, finalCode, userID, requestID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal approve: " + err.Error()})
		return
	}

	// Ensure user has AFFILIATE role
	config.DB.Exec(`
		INSERT IGNORE INTO user_roles (user_id, role_id)
		SELECT ?, id FROM roles WHERE name = 'AFFILIATE'
	`, partnership.UserID)

	// Notify affiliate
	CreateNotification(
		partnership.UserID,
		"affiliate_approved",
		"✅ Permintaan Affiliate Disetujui!",
		fmt.Sprintf("Anda sekarang affiliate untuk event \"%s\". Kode promo Anda: %s (Komisi: %.0f%%)", eventTitle, finalCode, input.CommissionPercentage),
	)

	c.JSON(http.StatusOK, gin.H{
		"message":     "Affiliate berhasil disetujui",
		"unique_code": finalCode,
		"commission":  input.CommissionPercentage,
	})
}

// RejectAffiliateRequest - Reject affiliate request
// PUT /organization/affiliate-requests/:id/reject
func RejectAffiliateRequest(c *gin.Context) {
	userID := c.GetInt64("user_id")
	requestID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	var orgID int64
	config.DB.Get(&orgID, "SELECT id FROM organizations WHERE owner_user_id = ?", userID)

	var partnership struct {
		UserID         int64 `db:"user_id"`
		OrganizationID int64 `db:"organization_id"`
		EventID        int64 `db:"event_id"`
	}
	config.DB.Get(&partnership, "SELECT user_id, organization_id, event_id FROM affiliate_partnerships WHERE id = ?", requestID)

	if partnership.OrganizationID != orgID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	config.DB.Exec("UPDATE affiliate_partnerships SET status = 'REJECTED' WHERE id = ?", requestID)

	var eventTitle string
	config.DB.Get(&eventTitle, "SELECT title FROM events WHERE id = ?", partnership.EventID)

	CreateNotification(
		partnership.UserID,
		"affiliate_rejected",
		"❌ Permintaan Affiliate Ditolak",
		fmt.Sprintf("Permintaan affiliate untuk event \"%s\" ditolak", eventTitle),
	)

	c.JSON(http.StatusOK, gin.H{"message": "Request ditolak"})
}

// ===============================================
// HELPER FUNCTIONS
// ===============================================

// GetOrgAffiliateStats - Organization sees affiliate performance stats
// GET /organization/affiliate-stats
func GetOrgAffiliateStats(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Get org ID
	var orgID int64
	err := config.DB.Get(&orgID, "SELECT id FROM organizations WHERE owner_user_id = ?", userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organisasi tidak ditemukan"})
		return
	}

	var stats []struct {
		ID                   int64   `db:"id" json:"id"`
		UserID               int64   `db:"user_id" json:"user_id"`
		UserName             string  `db:"user_name" json:"user_name"`
		UserEmail            string  `db:"user_email" json:"user_email"`
		EventID              int64   `db:"event_id" json:"event_id"`
		EventTitle           string  `db:"event_title" json:"event_title"`
		UniqueCode           string  `db:"unique_code" json:"unique_code"`
		CommissionPercentage float64 `db:"commission_percentage" json:"commission_percentage"`
		TotalBuyers          int     `db:"total_buyers" json:"total_buyers"`
		TotalEarnings        float64 `db:"total_earnings" json:"total_earnings"`
	}

	// Simplified query - get approved affiliates first
	err = config.DB.Select(&stats, `
		SELECT 
			ap.id, ap.user_id, u.name as user_name, u.email as user_email,
			ap.event_id, e.title as event_title, ap.unique_code, ap.commission_percentage,
			0 as total_buyers, 0 as total_earnings
		FROM affiliate_partnerships ap
		JOIN users u ON ap.user_id = u.id
		JOIN events e ON ap.event_id = e.id
		WHERE ap.organization_id = ? AND ap.status = 'APPROVED'
		ORDER BY ap.created_at DESC
	`, orgID)

	fmt.Printf("[ORG-AFFILIATE-STATS] orgID=%d, found %d affiliates, err=%v\n", orgID, len(stats), err)

	if err != nil {
		fmt.Printf("[ORG-AFFILIATE-STATS] Query error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil statistik: " + err.Error()})
		return
	}

	// Calculate stats for each affiliate from purchases
	for i := range stats {
		var buyers int
		var earnings float64
		config.DB.Get(&buyers, `
			SELECT COUNT(DISTINCT p.user_id)
			FROM purchases p
			WHERE p.affiliate_code = ? AND p.status = 'PAID'
		`, stats[i].UniqueCode)

		config.DB.Get(&earnings, `
			SELECT COALESCE(SUM(p.price_paid * ? / 100), 0)
			FROM purchases p
			WHERE p.affiliate_code = ? AND p.status = 'PAID'
		`, stats[i].CommissionPercentage, stats[i].UniqueCode)

		stats[i].TotalBuyers = buyers
		stats[i].TotalEarnings = earnings
	}

	if stats == nil {
		stats = make([]struct {
			ID                   int64   `db:"id" json:"id"`
			UserID               int64   `db:"user_id" json:"user_id"`
			UserName             string  `db:"user_name" json:"user_name"`
			UserEmail            string  `db:"user_email" json:"user_email"`
			EventID              int64   `db:"event_id" json:"event_id"`
			EventTitle           string  `db:"event_title" json:"event_title"`
			UniqueCode           string  `db:"unique_code" json:"unique_code"`
			CommissionPercentage float64 `db:"commission_percentage" json:"commission_percentage"`
			TotalBuyers          int     `db:"total_buyers" json:"total_buyers"`
			TotalEarnings        float64 `db:"total_earnings" json:"total_earnings"`
		}, 0)
	}

	c.JSON(http.StatusOK, stats)
}

// generateAffiliateCode creates a unique promo code
func generateAffiliateCode(eventTitle string, userID int64) string {
	// Clean event title: uppercase, alphanumeric only
	reg := regexp.MustCompile(`[^a-zA-Z0-9]+`)
	cleanTitle := strings.ToUpper(reg.ReplaceAllString(eventTitle, ""))
	if len(cleanTitle) > 8 {
		cleanTitle = cleanTitle[:8]
	}
	return fmt.Sprintf("%s-%d", cleanTitle, userID)
}
