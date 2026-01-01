package controllers

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
	"BACKEND/models"
)

// =======================================
// PUBLIC: GET ALL ORGANIZATIONS
// =======================================
func GetPublicOrganizations(c *gin.Context) {
	var organizations []struct {
		ID          int64   `db:"id" json:"id"`
		Name        string  `db:"name" json:"name"`
		Description *string `db:"description" json:"description"`
		Category    *string `db:"category" json:"category"`
		LogoURL     *string `db:"logo_url" json:"logo_url"`
		EventCount  int     `db:"event_count" json:"event_count"`
	}

	err := config.DB.Select(&organizations, `
		SELECT o.id, o.name, o.description, o.category, o.logo_url,
			(SELECT COUNT(*) FROM events e WHERE e.organization_id = o.id AND e.is_published = 1) as event_count
		FROM organizations o
		ORDER BY event_count DESC, o.name ASC
		LIMIT 50
	`)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch organizations"})
		return
	}

	c.JSON(200, gin.H{"organizations": organizations})
}

// =======================================
// ORGANIZATION: GET PROFILE
// =======================================
func GetOrganizationProfile(c *gin.Context) {

	// Read user_id from context robustly
	var userID int64
	if v, ok := c.Get("user_id"); ok {
		switch t := v.(type) {
		case int64:
			userID = t
		case int:
			userID = int64(t)
		case float64:
			userID = int64(t)
		default:
			userID = 0
		}
	}

	// Debug: Print the user_id we're searching for
	fmt.Printf("DEBUG GetOrganizationProfile: Searching for owner_user_id=%d\n", userID)

	var org models.Organization

	err := config.DB.Get(&org, `
		SELECT * FROM organizations WHERE owner_user_id = ?
	`, userID)

	if err != nil {
		// Log for debugging
		fmt.Printf("DEBUG: No organization found for user_id=%d, error=%v\n", userID, err)
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Organization profile not found",
			"user_id": userID,
		})
		return
	}

	// Debug: Success
	fmt.Printf("DEBUG: Found organization ID=%d, name='%s' for user_id=%d\n", org.ID, org.Name, userID)
	c.JSON(http.StatusOK, gin.H{"organization": org})
}

// =======================================
// ORGANIZATION: UPDATE PROFILE
// =======================================

type UpdateOrgProfileRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	LogoURL     string `json:"logo_url"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Website     string `json:"website"`
	SocialLink  string `json:"social_link"`
	Address     string `json:"address"`
}

func UpdateOrganizationProfile(c *gin.Context) {

	userID := c.GetInt64("user_id")

	var req UpdateOrgProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := config.DB.Exec(`
		UPDATE organizations 
		SET name = ?, 
			description = ?, 
			category = ?, 
			logo_url = ?, 
			email = ?, 
			phone = ?, 
			website = ?,
			social_link = ?,
			address = ?
		WHERE owner_user_id = ?
	`,
		req.Name,
		req.Description,
		req.Category,
		req.LogoURL,
		req.Email,
		req.Phone,
		req.Website,
		req.SocialLink,
		req.Address,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update organization profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Organization profile updated successfully",
	})
}

// =======================================
// ORGANIZATION: REPORT (TOTAL EVENT + BUYERS PER EVENT + REVENUE)
// =======================================
func GetOrganizationReport(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// 1. Ambil org id milik user
	var orgID int64
	err := config.DB.Get(&orgID, `SELECT id FROM organizations WHERE owner_user_id = ?`, userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Organization not found"})
		return
	}

	// 2. Total events
	var total int
	config.DB.Get(&total, `SELECT COUNT(*) FROM events WHERE organization_id = ?`, orgID)

	// 3. Detail events with buyer counts and revenue
	type EventStat struct {
		ID           int64   `db:"id" json:"id"`
		Title        string  `db:"title" json:"title"`
		ThumbnailURL *string `db:"thumbnail_url" json:"thumbnail_url"`
		Buyers       int     `db:"buyers" json:"buyers"`
		Revenue      float64 `db:"revenue" json:"revenue"`
		CreatedAt    string  `db:"created_at" json:"created_at"`
	}

	var events []EventStat
	query := `
		SELECT e.id, e.title, e.thumbnail_url, e.created_at,
			(SELECT COUNT(DISTINCT p.user_id) FROM purchases p JOIN sessions s ON p.session_id = s.id WHERE s.event_id = e.id) AS buyers,
			(SELECT COALESCE(SUM(p.price_paid), 0) FROM purchases p JOIN sessions s ON p.session_id = s.id WHERE s.event_id = e.id) AS revenue
		FROM events e
		WHERE e.organization_id = ?
		ORDER BY e.created_at DESC
	`
	config.DB.Select(&events, query, orgID)

	if events == nil {
		events = []EventStat{}
	}

	// 4. Calculate total revenue
	var totalRevenue float64
	for _, e := range events {
		totalRevenue += e.Revenue
	}

	// 5. Calculate withdrawable amount (e.g. 90% after platform fee)
	withdrawable := totalRevenue * 0.90

	c.JSON(200, gin.H{
		"total_events":  total,
		"events":        events,
		"total_revenue": totalRevenue,
		"withdrawable":  withdrawable,
		"platform_fee":  0.10,
	})
}

// =======================================
// ORGANIZATION: UPLOAD LOGO
// =======================================
func UploadOrganizationLogo(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Get file from form
	file, err := c.FormFile("logo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Logo file is required"})
		return
	}

	// Validate file size (max 2MB)
	if file.Size > 2*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must be less than 2MB"})
		return
	}

	// Generate unique filename
	ext := ".jpg"
	if file.Filename != "" {
		for _, e := range []string{".png", ".jpg", ".jpeg", ".gif", ".webp"} {
			if len(file.Filename) > len(e) && file.Filename[len(file.Filename)-len(e):] == e {
				ext = e
				break
			}
		}
	}

	// Get org ID
	var orgID int64
	err = config.DB.Get(&orgID, `SELECT id FROM organizations WHERE owner_user_id = ?`, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	// Create directory if not exists
	uploadDir := "uploads/organization"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate unique filename with timestamp
	filename := fmt.Sprintf("org_logo_%d_%d%s", orgID, time.Now().UnixNano(), ext)
	uploadPath := uploadDir + "/" + filename

	// Save file
	if err := c.SaveUploadedFile(file, uploadPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save logo file: " + err.Error()})
		return
	}

	// Update database
	_, err = config.DB.Exec(`UPDATE organizations SET logo_url = ? WHERE owner_user_id = ?`, uploadPath, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update logo URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Logo uploaded successfully",
		"logo_url": uploadPath,
	})
}

// =======================================
// ORGANIZATION: GET EVENT BUYERS
// =======================================
func GetEventBuyers(c *gin.Context) {
	userID := c.GetInt64("user_id")
	eventID := c.Param("eventID")

	// Verify organization owns this event
	var orgID int64
	err := config.DB.Get(&orgID, `SELECT id FROM organizations WHERE owner_user_id = ?`, userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Organization not found"})
		return
	}

	var eventOrgID int64
	err = config.DB.Get(&eventOrgID, `SELECT organization_id FROM events WHERE id = ?`, eventID)
	if err != nil || eventOrgID != orgID {
		c.JSON(403, gin.H{"error": "Event not found or not owned by your organization"})
		return
	}

	// Get buyer details
	type BuyerInfo struct {
		UserID        int64   `db:"user_id" json:"user_id"`
		UserName      string  `db:"user_name" json:"user_name"`
		UserEmail     string  `db:"user_email" json:"user_email"`
		SessionsCount int     `db:"sessions_count" json:"sessions_count"`
		TotalPaid     float64 `db:"total_paid" json:"total_paid"`
	}

	var buyers []BuyerInfo
	query := `
		SELECT 
			p.user_id,
			u.name as user_name,
			u.email as user_email,
			COUNT(p.id) as sessions_count,
			SUM(p.price_paid) as total_paid
		FROM purchases p
		JOIN users u ON p.user_id = u.id
		JOIN sessions s ON p.session_id = s.id
		WHERE s.event_id = ?
		GROUP BY p.user_id, u.name, u.email
		ORDER BY total_paid DESC
	`
	config.DB.Select(&buyers, query, eventID)

	if buyers == nil {
		buyers = []BuyerInfo{}
	}

	c.JSON(200, gin.H{"buyers": buyers})
}

// =======================================
// ORGANIZATION: BALANCE & WITHDRAWAL
// =======================================

// GetOrganizationBalance - Get balance summary for organization
func GetOrganizationBalance(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Get org ID
	var orgID int64
	err := config.DB.Get(&orgID, `SELECT id FROM organizations WHERE owner_user_id = ?`, userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Organization not found"})
		return
	}

	var balance struct {
		TotalEarned      float64 `db:"total_earned" json:"total_earned"`
		TotalWithdrawn   float64 `db:"total_withdrawn" json:"total_withdrawn"`
		AvailableBalance float64 `json:"available_balance"`
	}

	// Get from organization_balances table
	err = config.DB.Get(&balance, `
		SELECT COALESCE(total_earned, 0) as total_earned, 
		       COALESCE(total_withdrawn, 0) as total_withdrawn
		FROM organization_balances WHERE organization_id = ?
	`, orgID)

	if err != nil {
		// No balance record - calculate from purchases
		config.DB.Get(&balance.TotalEarned, `
			SELECT COALESCE(SUM(p.price_paid), 0)
			FROM purchases p
			JOIN sessions s ON p.session_id = s.id
			JOIN events e ON s.event_id = e.id
			WHERE e.organization_id = ? AND p.status = 'PAID'
		`, orgID)
		balance.TotalWithdrawn = 0
	}

	balance.AvailableBalance = balance.TotalEarned - balance.TotalWithdrawn

	c.JSON(200, gin.H{"balance": balance, "organization_id": orgID})
}

// SimulateOrgWithdraw - Simulate instant withdrawal for organization
func SimulateOrgWithdraw(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Get org ID
	var orgID int64
	err := config.DB.Get(&orgID, `SELECT id FROM organizations WHERE owner_user_id = ?`, userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Organization not found"})
		return
	}

	var input struct {
		Amount        float64 `json:"amount" binding:"required"`
		PaymentMethod string  `json:"payment_method" binding:"required"`
		AccountName   string  `json:"account_name" binding:"required"`
		AccountNumber string  `json:"account_number" binding:"required"`
		BankName      string  `json:"bank_name"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Data tidak lengkap"})
		return
	}

	// Minimum withdrawal Rp 50,000
	if input.Amount < 50000 {
		c.JSON(400, gin.H{"error": "Minimal penarikan Rp 50.000"})
		return
	}

	// Get current balance
	var balance struct {
		TotalEarned    float64 `db:"total_earned"`
		TotalWithdrawn float64 `db:"total_withdrawn"`
	}
	err = config.DB.Get(&balance, `
		SELECT COALESCE(total_earned, 0) as total_earned, 
		       COALESCE(total_withdrawn, 0) as total_withdrawn
		FROM organization_balances WHERE organization_id = ?
	`, orgID)

	if err != nil {
		// No balance record - check purchases
		config.DB.Get(&balance.TotalEarned, `
			SELECT COALESCE(SUM(p.price_paid), 0)
			FROM purchases p
			JOIN sessions s ON p.session_id = s.id
			JOIN events e ON s.event_id = e.id
			WHERE e.organization_id = ? AND p.status = 'PAID'
		`, orgID)
	}

	availableBalance := balance.TotalEarned - balance.TotalWithdrawn

	if input.Amount > availableBalance {
		c.JSON(400, gin.H{"error": fmt.Sprintf("Saldo tidak cukup. Saldo tersedia: Rp %.0f", availableBalance)})
		return
	}

	// Update balance - simulate instant withdrawal
	_, err = config.DB.Exec(`
		INSERT INTO organization_balances (organization_id, total_earned, total_withdrawn, balance)
		VALUES (?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE 
			total_withdrawn = total_withdrawn + ?,
			balance = total_earned - (total_withdrawn + ?)
	`, orgID, balance.TotalEarned, input.Amount, balance.TotalEarned-input.Amount, input.Amount, input.Amount)

	if err != nil {
		fmt.Printf("[ORG WITHDRAW] Error updating balance: %v\n", err)
		c.JSON(500, gin.H{"error": "Gagal memproses penarikan"})
		return
	}

	// Record transaction
	withdrawRef := fmt.Sprintf("WD-ORG-%d-%d", time.Now().Unix(), orgID)
	description := fmt.Sprintf("Penarikan ke %s - %s (%s)", input.PaymentMethod, input.AccountName, input.AccountNumber)
	if input.PaymentMethod == "BANK" && input.BankName != "" {
		description = fmt.Sprintf("Penarikan ke %s %s - %s (%s)", input.BankName, input.PaymentMethod, input.AccountName, input.AccountNumber)
	}

	config.DB.Exec(`
		INSERT INTO financial_transactions (transaction_type, entity_type, entity_id, amount, description, reference_id)
		VALUES ('WITHDRAWAL', 'ORGANIZATION', ?, ?, ?, ?)
	`, orgID, input.Amount, description, withdrawRef)

	fmt.Printf("[ORG WITHDRAW] ✅ Org %d withdrew Rp %.0f to %s\n", orgID, input.Amount, input.PaymentMethod)

	c.JSON(200, gin.H{
		"message":     "Penarikan berhasil diproses",
		"amount":      input.Amount,
		"reference":   withdrawRef,
		"new_balance": availableBalance - input.Amount,
	})
}

// GetOrgWithdrawalHistory - Get withdrawal transaction history for organization
func GetOrgWithdrawalHistory(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Get org ID
	var orgID int64
	err := config.DB.Get(&orgID, `SELECT id FROM organizations WHERE owner_user_id = ?`, userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Organization not found"})
		return
	}

	var transactions []struct {
		ID          int64   `db:"id" json:"id"`
		Amount      float64 `db:"amount" json:"amount"`
		Description string  `db:"description" json:"description"`
		ReferenceID string  `db:"reference_id" json:"reference_id"`
		CreatedAt   string  `db:"created_at" json:"created_at"`
	}

	config.DB.Select(&transactions, `
		SELECT id, amount, description, reference_id, created_at
		FROM financial_transactions
		WHERE entity_type = 'ORGANIZATION' AND entity_id = ? AND transaction_type = 'WITHDRAWAL'
		ORDER BY created_at DESC
		LIMIT 50
	`, orgID)

	c.JSON(200, gin.H{"transactions": transactions})
}
