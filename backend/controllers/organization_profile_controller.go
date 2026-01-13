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
		Email       *string `db:"email" json:"email"`
		Phone       *string `db:"phone" json:"phone"`
		Website     *string `db:"website" json:"website"`
		SocialLink  *string `db:"social_link" json:"social_link"`
		Address     *string `db:"address" json:"address"`
		EventCount  int     `db:"event_count" json:"event_count"`
	}

	err := config.DB.Select(&organizations, `
		SELECT o.id, o.name, o.description, o.category, o.logo_url,
			o.email, o.phone, o.website, o.social_link, o.address,
			(SELECT COUNT(*) FROM events e WHERE e.organization_id = o.id AND e.publish_status = 'PUBLISHED') as event_count
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

	// 2. Get events (simpler query)
	type EventBasic struct {
		ID           int64   `db:"id" json:"id"`
		Title        string  `db:"title" json:"title"`
		ThumbnailURL *string `db:"thumbnail_url" json:"thumbnail_url"`
		CreatedAt    string  `db:"created_at" json:"created_at"`
	}

	var eventsBasic []EventBasic
	err = config.DB.Select(&eventsBasic, `
		SELECT id, title, thumbnail_url, created_at
		FROM events WHERE organization_id = ?
		ORDER BY created_at DESC
	`, orgID)

	if err != nil {
		fmt.Printf("[ORG-REPORT] Error fetching events: %v\n", err)
	}

	fmt.Printf("[ORG-REPORT] orgID=%d, found %d events\n", orgID, len(eventsBasic))

	// 3. For each event, calculate stats
	type EventStat struct {
		ID                  int64   `json:"id"`
		Title               string  `json:"title"`
		ThumbnailURL        *string `json:"thumbnail_url"`
		Buyers              int     `json:"buyers"`
		GrossRevenue        float64 `json:"gross_revenue"`
		AffiliateCommission float64 `json:"affiliate_commission"`
		NetRevenue          float64 `json:"net_revenue"`
		CreatedAt           string  `json:"created_at"`
	}

	var events []EventStat
	var totalBuyers int
	var totalGrossRevenue, totalAffiliateCommission, totalNetRevenue float64

	for _, eb := range eventsBasic {
		var buyers int
		var grossRevenue float64
		var affiliateCommission float64

		config.DB.Get(&buyers, `
			SELECT COUNT(DISTINCT p.user_id) 
			FROM purchases p 
			JOIN sessions s ON p.session_id = s.id 
			WHERE s.event_id = ? AND p.status = 'PAID'
		`, eb.ID)

		config.DB.Get(&grossRevenue, `
			SELECT COALESCE(SUM(p.price_paid), 0) 
			FROM purchases p 
			JOIN sessions s ON p.session_id = s.id 
			WHERE s.event_id = ? AND p.status = 'PAID'
		`, eb.ID)

		config.DB.Get(&affiliateCommission, `
			SELECT COALESCE(SUM(p.price_paid * COALESCE(ap.commission_percentage, 0) / 100), 0)
			FROM purchases p 
			JOIN sessions s ON p.session_id = s.id 
			LEFT JOIN affiliate_partnerships ap ON p.affiliate_code = ap.unique_code AND ap.event_id = s.event_id
			WHERE s.event_id = ? AND p.status = 'PAID'
		`, eb.ID)

		netRevenue := grossRevenue - affiliateCommission

		events = append(events, EventStat{
			ID:                  eb.ID,
			Title:               eb.Title,
			ThumbnailURL:        eb.ThumbnailURL,
			Buyers:              buyers,
			GrossRevenue:        grossRevenue,
			AffiliateCommission: affiliateCommission,
			NetRevenue:          netRevenue,
			CreatedAt:           eb.CreatedAt,
		})

		totalBuyers += buyers
		totalGrossRevenue += grossRevenue
		totalAffiliateCommission += affiliateCommission
		totalNetRevenue += netRevenue
	}

	if events == nil {
		events = []EventStat{}
	}

	// 4. Get balance from organization_balances
	var balance struct {
		AvailableBalance float64 `db:"balance"`
		TotalWithdrawn   float64 `db:"total_withdrawn"`
	}
	config.DB.Get(&balance, `
		SELECT COALESCE(balance, 0) as balance, COALESCE(total_withdrawn, 0) as total_withdrawn
		FROM organization_balances WHERE organization_id = ?
	`, orgID)

	c.JSON(200, gin.H{
		"total_events":         len(events),
		"total_buyers":         totalBuyers,
		"events":               events,
		"gross_revenue":        totalGrossRevenue,
		"affiliate_commission": totalAffiliateCommission,
		"net_revenue":          totalNetRevenue,
		"available_balance":    balance.AvailableBalance,
		"total_withdrawn":      balance.TotalWithdrawn,
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

	fmt.Printf("[EVENT-BUYERS] Request: userID=%d, eventID=%s\n", userID, eventID)

	// Verify organization owns this event
	var orgID int64
	err := config.DB.Get(&orgID, `SELECT id FROM organizations WHERE owner_user_id = ?`, userID)
	if err != nil {
		fmt.Printf("[EVENT-BUYERS] Error: Organization not found for user %d: %v\n", userID, err)
		c.JSON(400, gin.H{"error": "Organization not found"})
		return
	}

	fmt.Printf("[EVENT-BUYERS] Found orgID=%d for userID=%d\n", orgID, userID)

	var eventOrgID int64
	err = config.DB.Get(&eventOrgID, `SELECT organization_id FROM events WHERE id = ?`, eventID)
	if err != nil {
		fmt.Printf("[EVENT-BUYERS] Error: Event %s not found: %v\n", eventID, err)
		c.JSON(403, gin.H{"error": "Event not found"})
		return
	}

	fmt.Printf("[EVENT-BUYERS] Event %s has organization_id=%d (my org=%d)\n", eventID, eventOrgID, orgID)

	if eventOrgID != orgID {
		fmt.Printf("[EVENT-BUYERS] Error: Event org mismatch! eventOrgID=%d != orgID=%d\n", eventOrgID, orgID)
		c.JSON(403, gin.H{"error": "Event not owned by your organization"})
		return
	}

	// Get detailed purchase list (individual purchases, not grouped)
	type PurchaseDetail struct {
		ID               int64   `db:"id" json:"id"`
		UserID           int64   `db:"user_id" json:"user_id"`
		UserName         string  `db:"user_name" json:"user_name"`
		UserEmail        string  `db:"user_email" json:"user_email"`
		UserPhone        string  `db:"user_phone" json:"user_phone"`
		SessionID        int64   `db:"session_id" json:"session_id"`
		SessionTitle     string  `db:"session_title" json:"session_title"`
		PricePaid        float64 `db:"price_paid" json:"price_paid"`
		AffiliateCode    string  `db:"affiliate_code" json:"affiliate_code"`
		AffiliateName    string  `db:"affiliate_name" json:"affiliate_name"`
		CommissionPct    float64 `db:"commission_pct" json:"commission_pct"`
		CommissionAmount float64 `db:"commission_amount" json:"commission_amount"`
		NetAmount        float64 `db:"net_amount" json:"net_amount"`
		PurchasedAt      string  `db:"purchased_at" json:"purchased_at"`
		PaymentStatus    string  `db:"payment_status" json:"payment_status"`
	}

	var purchases []PurchaseDetail

	// Debug: First check if there are ANY purchases for this event
	var rawCount int
	config.DB.Get(&rawCount, `
		SELECT COUNT(*) FROM purchases p 
		JOIN sessions s ON p.session_id = s.id 
		WHERE s.event_id = ?
	`, eventID)
	fmt.Printf("[EVENT-BUYERS] Raw purchase count for eventID=%s: %d\n", eventID, rawCount)

	// Also check paid only
	var debugPaidCount int
	config.DB.Get(&debugPaidCount, `
		SELECT COUNT(*) FROM purchases p 
		JOIN sessions s ON p.session_id = s.id 
		WHERE s.event_id = ? AND p.status = 'PAID'
	`, eventID)
	fmt.Printf("[EVENT-BUYERS] Paid purchase count for eventID=%s: %d\n", eventID, debugPaidCount)

	// Try the full query with affiliate info
	query := `
		SELECT 
			p.id,
			p.user_id,
			u.name as user_name,
			u.email as user_email,
			COALESCE(u.phone, '') as user_phone,
			p.session_id,
			s.title as session_title,
			p.price_paid,
			COALESCE(p.affiliate_code, '') as affiliate_code,
			COALESCE(aff_user.name, '') as affiliate_name,
			COALESCE(ap.commission_percentage, 0) as commission_pct,
			CASE 
				WHEN ap.commission_percentage IS NOT NULL 
				THEN p.price_paid * ap.commission_percentage / 100 
				ELSE 0 
			END as commission_amount,
			CASE 
				WHEN ap.commission_percentage IS NOT NULL 
				THEN p.price_paid - (p.price_paid * ap.commission_percentage / 100) 
				ELSE p.price_paid 
			END as net_amount,
			p.purchased_at as purchased_at,
			COALESCE(p.status, 'PENDING') as payment_status
		FROM purchases p
		JOIN users u ON p.user_id = u.id
		JOIN sessions s ON p.session_id = s.id
		LEFT JOIN affiliate_partnerships ap ON p.affiliate_code = ap.unique_code AND ap.event_id = s.event_id
		LEFT JOIN users aff_user ON ap.user_id = aff_user.id
		WHERE s.event_id = ?
		ORDER BY p.purchased_at DESC
	`
	err = config.DB.Select(&purchases, query, eventID)

	// Debug logging
	fmt.Printf("[EVENT-BUYERS] eventID=%s, purchases_count=%d, err=%v\n", eventID, len(purchases), err)

	// If main query failed or returned empty but we know there are purchases, try simpler query
	if (err != nil || len(purchases) == 0) && rawCount > 0 {
		fmt.Printf("[EVENT-BUYERS] Trying fallback query...\n")

		// Simpler query without affiliate joins
		fallbackQuery := `
			SELECT 
				p.id,
				p.user_id,
				u.name as user_name,
				u.email as user_email,
				COALESCE(u.phone, '') as user_phone,
				p.session_id,
				s.title as session_title,
				p.price_paid,
				COALESCE(p.affiliate_code, '') as affiliate_code,
				'' as affiliate_name,
				0 as commission_pct,
				0 as commission_amount,
				p.price_paid as net_amount,
				p.purchased_at as purchased_at,
				COALESCE(p.status, 'PENDING') as payment_status
			FROM purchases p
			JOIN users u ON p.user_id = u.id
			JOIN sessions s ON p.session_id = s.id
			WHERE s.event_id = ?
			ORDER BY p.purchased_at DESC
		`
		err = config.DB.Select(&purchases, fallbackQuery, eventID)
		fmt.Printf("[EVENT-BUYERS] Fallback result: purchases_count=%d, err=%v\n", len(purchases), err)
	}

	if purchases == nil {
		purchases = []PurchaseDetail{}
	}

	// Calculate summary
	var totalRevenue, totalCommission, totalNetRevenue float64
	var paidCount, pendingCount int
	for _, p := range purchases {
		if p.PaymentStatus == "PAID" {
			totalRevenue += p.PricePaid
			totalCommission += p.CommissionAmount
			totalNetRevenue += p.NetAmount
			paidCount++
		} else {
			pendingCount++
		}
	}

	c.JSON(200, gin.H{
		"purchases": purchases,
		"summary": gin.H{
			"total_purchases":  len(purchases),
			"paid_count":       paidCount,
			"pending_count":    pendingCount,
			"gross_revenue":    totalRevenue,
			"total_commission": totalCommission,
			"net_revenue":      totalNetRevenue,
		},
	})
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
