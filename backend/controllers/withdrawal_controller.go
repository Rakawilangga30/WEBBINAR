package controllers

import (
	"fmt"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"BACKEND/config"

	"github.com/gin-gonic/gin"
)

// ===============================================
// WITHDRAWAL / PAYOUT REQUEST CONTROLLER
// Sistem Payout - Simulasi Midtrans Iris
// ===============================================

// RequestOrgWithdrawal - Organization requests payout
// POST /organization/withdrawal-request
func RequestOrgWithdrawal(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Get organization owned by user
	var org struct {
		ID   int64  `db:"id"`
		Name string `db:"name"`
	}
	err := config.DB.Get(&org, "SELECT id, name FROM organizations WHERE owner_user_id = ?", userID)
	if err != nil {
		fmt.Printf("[ORG-PAYOUT] Organization not found for user %d: %v\n", userID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Organisasi tidak ditemukan"})
		return
	}

	// Get balance from organization_balances table
	var balance float64
	config.DB.Get(&balance, `
		SELECT COALESCE(balance, 0) FROM organization_balances WHERE organization_id = ?
	`, org.ID)

	fmt.Printf("[ORG-PAYOUT] orgID=%d, name=%s, balance=%.0f\n", org.ID, org.Name, balance)

	if balance <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Saldo tidak mencukupi untuk payout"})
		return
	}

	var input struct {
		Amount          float64 `json:"amount" binding:"required"`
		BankName        string  `json:"bank_name" binding:"required"`
		BankAccount     string  `json:"bank_account" binding:"required"`
		BankAccountName string  `json:"bank_account_name" binding:"required"`
		Notes           string  `json:"notes"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lengkapi semua data yang diperlukan"})
		return
	}

	// Validasi amount
	if input.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jumlah payout harus lebih dari 0"})
		return
	}
	if input.Amount > balance {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Saldo tidak cukup. Saldo Anda: Rp %.0f", balance)})
		return
	}

	// Verifikasi data rekening bank tidak kosong (wajib untuk payout)
	if len(input.BankAccount) < 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nomor rekening tidak valid"})
		return
	}

	// Check if already has an active (PENDING) request
	var activeCount int
	config.DB.Get(&activeCount, `
		SELECT COUNT(*) FROM withdrawal_requests 
		WHERE requester_type = 'ORGANIZATION' 
		AND requester_id = ? 
		AND status IN ('PENDING', 'APPROVED')
		AND MONTH(created_at) = MONTH(NOW()) 
		AND YEAR(created_at) = YEAR(NOW())
	`, org.ID)
	if activeCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah memiliki permintaan payout aktif bulan ini. Tunggu hingga diproses atau bulan depan."})
		return
	}

	// Check total attempts this month (max 7)
	var totalAttempts int
	config.DB.Get(&totalAttempts, `
		SELECT COUNT(*) FROM withdrawal_requests 
		WHERE requester_type = 'ORGANIZATION' 
		AND requester_id = ? 
		AND MONTH(created_at) = MONTH(NOW()) 
		AND YEAR(created_at) = YEAR(NOW())
	`, org.ID)
	if totalAttempts >= 7 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah mencapai batas maksimal 7 percobaan payout bulan ini."})
		return
	}

	// Insert payout request (org_confirmed = 1 karena tidak perlu konfirmasi org lagi)
	_, err = config.DB.Exec(`
		INSERT INTO withdrawal_requests 
		(requester_type, requester_id, amount, bank_name, bank_account, bank_account_name, notes, org_confirmed, payout_status)
		VALUES ('ORGANIZATION', ?, ?, ?, ?, ?, ?, 1, 'PENDING_PAYOUT')
	`, org.ID, input.Amount, input.BankName, input.BankAccount, input.BankAccountName, input.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengajukan payout: " + err.Error()})
		return
	}

	// Notify admins
	var adminIDs []int64
	config.DB.Select(&adminIDs, `
		SELECT u.id FROM users u 
		JOIN user_roles ur ON u.id = ur.user_id 
		JOIN roles r ON ur.role_id = r.id 
		WHERE r.name IN ('ADMIN', 'SUPERADMIN')
	`)
	for _, adminID := range adminIDs {
		CreateNotification(
			adminID,
			"payout_request",
			"💸 Permintaan Payout Baru",
			fmt.Sprintf("Organisasi \"%s\" mengajukan payout Rp %.0f ke %s (%s)", org.Name, input.Amount, input.BankName, input.BankAccount),
		)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permintaan payout berhasil diajukan. Menunggu verifikasi admin."})
}

// RequestAffiliateWithdrawal - Affiliate requests payout
// POST /affiliate/withdrawal-request
func RequestAffiliateWithdrawal(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Verifikasi affiliate terdaftar aktif di minimal 1 event/organisasi
	var partnershipCount int
	config.DB.Get(&partnershipCount, `
		SELECT COUNT(*) FROM affiliate_partnerships 
		WHERE user_id = ? AND status = 'APPROVED' AND is_active = 1
	`, userID)
	if partnershipCount == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Kamu belum terdaftar sebagai affiliate aktif di event manapun"})
		return
	}

	// Get affiliate balance
	var balanceData struct {
		TotalEarned    float64 `db:"total_earned"`
		TotalWithdrawn float64 `db:"total_withdrawn"`
	}
	err := config.DB.Get(&balanceData, `
		SELECT COALESCE(total_earned, 0) as total_earned, 
		       COALESCE(total_withdrawn, 0) as total_withdrawn
		FROM affiliate_balances WHERE user_id = ?
	`, userID)

	var availableBalance float64
	if err != nil {
		config.DB.Get(&availableBalance, `
			SELECT COALESCE(SUM(al.affiliate_amount), 0)
			FROM affiliate_ledgers al
			JOIN affiliate_submissions asub ON al.affiliate_submission_id = asub.id
			WHERE asub.user_id = ?
		`, userID)
	} else {
		availableBalance = balanceData.TotalEarned - balanceData.TotalWithdrawn
	}

	fmt.Printf("[AFFILIATE-PAYOUT] userID=%d, available_balance=%.0f\n", userID, availableBalance)

	if availableBalance <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Saldo tidak mencukupi untuk payout"})
		return
	}

	var input struct {
		Amount          float64 `json:"amount" binding:"required"`
		BankName        string  `json:"bank_name" binding:"required"`
		BankAccount     string  `json:"bank_account" binding:"required"`
		BankAccountName string  `json:"bank_account_name" binding:"required"`
		Notes           string  `json:"notes"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lengkapi semua data yang diperlukan"})
		return
	}

	if input.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jumlah payout harus lebih dari 0"})
		return
	}
	if input.Amount > availableBalance {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Saldo tidak cukup. Saldo Anda: Rp %.0f", availableBalance)})
		return
	}
	if len(input.BankAccount) < 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nomor rekening tidak valid"})
		return
	}

	// Check active request this month
	var activeCount int
	config.DB.Get(&activeCount, `
		SELECT COUNT(*) FROM withdrawal_requests 
		WHERE requester_type = 'AFFILIATE' 
		AND requester_id = ? 
		AND status IN ('PENDING', 'APPROVED')
		AND MONTH(created_at) = MONTH(NOW()) 
		AND YEAR(created_at) = YEAR(NOW())
	`, userID)
	if activeCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah memiliki permintaan payout aktif bulan ini."})
		return
	}

	// Check total attempts this month
	var totalAttempts int
	config.DB.Get(&totalAttempts, `
		SELECT COUNT(*) FROM withdrawal_requests 
		WHERE requester_type = 'AFFILIATE' 
		AND requester_id = ? 
		AND MONTH(created_at) = MONTH(NOW()) 
		AND YEAR(created_at) = YEAR(NOW())
	`, userID)
	if totalAttempts >= 7 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah mencapai batas maksimal 7 percobaan payout bulan ini."})
		return
	}

	// Insert payout request - org_confirmed = 0 (menunggu konfirmasi organisasi)
	result, err := config.DB.Exec(`
		INSERT INTO withdrawal_requests 
		(requester_type, requester_id, amount, bank_name, bank_account, bank_account_name, notes, org_confirmed, payout_status)
		VALUES ('AFFILIATE', ?, ?, ?, ?, ?, ?, 0, 'PENDING_PAYOUT')
	`, userID, input.Amount, input.BankName, input.BankAccount, input.BankAccountName, input.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengajukan payout: " + err.Error()})
		return
	}

	newRequestID, _ := result.LastInsertId()

	// Notify organisasi yang punya event dengan affiliate ini
	var orgOwnerIDs []int64
	config.DB.Select(&orgOwnerIDs, `
		SELECT DISTINCT o.owner_user_id
		FROM affiliate_partnerships ap
		JOIN organizations o ON ap.organization_id = o.id
		WHERE ap.user_id = ? AND ap.status = 'APPROVED' AND ap.is_active = 1
	`, userID)

	var userName string
	config.DB.Get(&userName, "SELECT name FROM users WHERE id = ?", userID)

	for _, ownerID := range orgOwnerIDs {
		CreateNotification(
			ownerID,
			"affiliate_payout_confirmation",
			"💸 Konfirmasi Payout Affiliate",
			fmt.Sprintf("Affiliate \"%s\" mengajukan payout Rp %.0f. Harap konfirmasi terlebih dahulu.", userName, input.Amount),
		)
	}

	fmt.Printf("[AFFILIATE-PAYOUT] Request #%d dibuat, menunggu konfirmasi org\n", newRequestID)
	c.JSON(http.StatusOK, gin.H{"message": "Permintaan payout berhasil diajukan. Menunggu konfirmasi organisasi."})
}

// GetAffiliateWithdrawalsForOrg - Org lihat daftar payout request affiliate dari event mereka
// GET /organization/affiliate-withdrawals
func GetAffiliateWithdrawalsForOrg(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Get org ID
	var orgID int64
	err := config.DB.Get(&orgID, "SELECT id FROM organizations WHERE owner_user_id = ?", userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organisasi tidak ditemukan"})
		return
	}

	var requests []struct {
		ID              int64      `db:"id" json:"id"`
		RequesterID     int64      `db:"requester_id" json:"requester_id"`
		UserName        string     `db:"user_name" json:"user_name"`
		UserEmail       string     `db:"user_email" json:"user_email"`
		Amount          float64    `db:"amount" json:"amount"`
		BankName        string     `db:"bank_name" json:"bank_name"`
		BankAccount     string     `db:"bank_account" json:"bank_account"`
		BankAccountName string     `db:"bank_account_name" json:"bank_account_name"`
		Notes           *string    `db:"notes" json:"notes"`
		Status          string     `db:"status" json:"status"`
		PayoutStatus    string     `db:"payout_status" json:"payout_status"`
		OrgConfirmed    bool       `db:"org_confirmed" json:"org_confirmed"`
		OrgConfirmedAt  *time.Time `db:"org_confirmed_at" json:"org_confirmed_at"`
		CreatedAt       time.Time  `db:"created_at" json:"created_at"`
		// Affiliate event info
		EventTitles string `db:"event_titles" json:"event_titles"`
	}

	err = config.DB.Select(&requests, `
		SELECT 
			wr.id, wr.requester_id,
			u.name as user_name, u.email as user_email,
			wr.amount, wr.bank_name, wr.bank_account, wr.bank_account_name,
			wr.notes, wr.status, wr.payout_status, wr.org_confirmed,
			wr.org_confirmed_at, wr.created_at,
			GROUP_CONCAT(DISTINCT e.title SEPARATOR ', ') as event_titles
		FROM withdrawal_requests wr
		JOIN users u ON wr.requester_id = u.id
		JOIN affiliate_partnerships ap ON ap.user_id = wr.requester_id 
			AND ap.organization_id = ? 
			AND ap.status = 'APPROVED'
		JOIN events e ON ap.event_id = e.id
		WHERE wr.requester_type = 'AFFILIATE'
		GROUP BY wr.id, wr.requester_id, u.name, u.email, wr.amount, 
		         wr.bank_name, wr.bank_account, wr.bank_account_name,
		         wr.notes, wr.status, wr.payout_status, wr.org_confirmed,
		         wr.org_confirmed_at, wr.created_at
		ORDER BY wr.org_confirmed ASC, wr.created_at DESC
	`, orgID)

	if err != nil {
		fmt.Printf("[ORG-AFFILIATE-WITHDRAWALS] Error: %v\n", err)
		requests = make([]struct {
			ID              int64      `db:"id" json:"id"`
			RequesterID     int64      `db:"requester_id" json:"requester_id"`
			UserName        string     `db:"user_name" json:"user_name"`
			UserEmail       string     `db:"user_email" json:"user_email"`
			Amount          float64    `db:"amount" json:"amount"`
			BankName        string     `db:"bank_name" json:"bank_name"`
			BankAccount     string     `db:"bank_account" json:"bank_account"`
			BankAccountName string     `db:"bank_account_name" json:"bank_account_name"`
			Notes           *string    `db:"notes" json:"notes"`
			Status          string     `db:"status" json:"status"`
			PayoutStatus    string     `db:"payout_status" json:"payout_status"`
			OrgConfirmed    bool       `db:"org_confirmed" json:"org_confirmed"`
			OrgConfirmedAt  *time.Time `db:"org_confirmed_at" json:"org_confirmed_at"`
			CreatedAt       time.Time  `db:"created_at" json:"created_at"`
			EventTitles     string     `db:"event_titles" json:"event_titles"`
		}, 0)
	}

	c.JSON(http.StatusOK, requests)
}

// ConfirmAffiliateWithdrawal - Org konfirmasi payout affiliate (approve tiket)
// PUT /organization/affiliate-withdrawals/:id/confirm
func ConfirmAffiliateWithdrawal(c *gin.Context) {
	userID := c.GetInt64("user_id")
	requestID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	// Get org milik user
	var orgID int64
	err := config.DB.Get(&orgID, "SELECT id FROM organizations WHERE owner_user_id = ?", userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organisasi tidak ditemukan"})
		return
	}

	// Get withdrawal request
	var request struct {
		ID           int64   `db:"id"`
		RequesterID  int64   `db:"requester_id"`
		Amount       float64 `db:"amount"`
		Status       string  `db:"status"`
		OrgConfirmed bool    `db:"org_confirmed"`
	}
	err = config.DB.Get(&request, `
		SELECT id, requester_id, amount, status, org_confirmed 
		FROM withdrawal_requests WHERE id = ? AND requester_type = 'AFFILIATE'
	`, requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request tidak ditemukan"})
		return
	}

	if request.Status != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request sudah diproses sebelumnya"})
		return
	}
	if request.OrgConfirmed {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payout ini sudah dikonfirmasi sebelumnya"})
		return
	}

	// Verifikasi bahwa affiliate ini memang punya partnership aktif di org ini
	var partnerCount int
	config.DB.Get(&partnerCount, `
		SELECT COUNT(*) FROM affiliate_partnerships
		WHERE user_id = ? AND organization_id = ? AND status = 'APPROVED' AND is_active = 1
	`, request.RequesterID, orgID)
	if partnerCount == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Affiliate ini tidak terdaftar di organisasi Anda"})
		return
	}

	// Update org_confirmed
	_, err = config.DB.Exec(`
		UPDATE withdrawal_requests 
		SET org_confirmed = 1, org_confirmed_by = ?, org_confirmed_at = NOW()
		WHERE id = ?
	`, userID, requestID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal konfirmasi payout"})
		return
	}

	// Notify affiliate
	CreateNotification(
		request.RequesterID,
		"payout_org_confirmed",
		"✅ Payout Dikonfirmasi Organisasi",
		fmt.Sprintf("Payout Anda sebesar Rp %.0f telah dikonfirmasi oleh organisasi. Sedang menunggu persetujuan admin.", request.Amount),
	)

	// Notify admins
	var orgName string
	config.DB.Get(&orgName, "SELECT name FROM organizations WHERE id = ?", orgID)
	var affiliateName string
	config.DB.Get(&affiliateName, "SELECT name FROM users WHERE id = ?", request.RequesterID)

	var adminIDs []int64
	config.DB.Select(&adminIDs, `
		SELECT u.id FROM users u 
		JOIN user_roles ur ON u.id = ur.user_id 
		JOIN roles r ON ur.role_id = r.id 
		WHERE r.name IN ('ADMIN', 'SUPERADMIN')
	`)
	for _, adminID := range adminIDs {
		CreateNotification(
			adminID,
			"affiliate_payout_confirmed",
			"💸 Payout Affiliate Siap Diproses",
			fmt.Sprintf("Org \"%s\" telah mengkonfirmasi payout affiliate \"%s\" sebesar Rp %.0f", orgName, affiliateName, request.Amount),
		)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payout affiliate berhasil dikonfirmasi. Admin akan memproses pembayaran."})
}

// RejectAffiliateWithdrawal - Org tolak payout affiliate
// PUT /organization/affiliate-withdrawals/:id/reject
func RejectAffiliateWithdrawal(c *gin.Context) {
	userID := c.GetInt64("user_id")
	requestID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	var orgID int64
	err := config.DB.Get(&orgID, "SELECT id FROM organizations WHERE owner_user_id = ?", userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organisasi tidak ditemukan"})
		return
	}

	var request struct {
		ID          int64   `db:"id"`
		RequesterID int64   `db:"requester_id"`
		Amount      float64 `db:"amount"`
		Status      string  `db:"status"`
	}
	err = config.DB.Get(&request, `
		SELECT id, requester_id, amount, status 
		FROM withdrawal_requests WHERE id = ? AND requester_type = 'AFFILIATE'
	`, requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request tidak ditemukan"})
		return
	}

	if request.Status != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request sudah diproses sebelumnya"})
		return
	}

	// Verifikasi partnership
	var partnerCount int
	config.DB.Get(&partnerCount, `
		SELECT COUNT(*) FROM affiliate_partnerships
		WHERE user_id = ? AND organization_id = ? AND status = 'APPROVED'
	`, request.RequesterID, orgID)
	if partnerCount == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Affiliate ini tidak terdaftar di organisasi Anda"})
		return
	}

	var input struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&input)
	if input.Reason == "" {
		input.Reason = "Ditolak oleh organisasi"
	}

	config.DB.Exec(`
		UPDATE withdrawal_requests 
		SET status = 'REJECTED', admin_notes = ?, payout_status = 'FAILED', processed_at = NOW(), processed_by = ?
		WHERE id = ?
	`, input.Reason, userID, requestID)

	// Notify affiliate
	CreateNotification(
		request.RequesterID,
		"payout_org_rejected",
		"❌ Payout Ditolak Organisasi",
		fmt.Sprintf("Payout Anda sebesar Rp %.0f ditolak oleh organisasi. Alasan: %s", request.Amount, input.Reason),
	)

	c.JSON(http.StatusOK, gin.H{"message": "Payout affiliate ditolak"})
}

// GetMyWithdrawalRequests - Get user's withdrawal requests (org or affiliate)
// GET /user/withdrawal-requests
func GetMyWithdrawalRequests(c *gin.Context) {
	userID := c.GetInt64("user_id")
	requesterType := c.Query("type") // "ORGANIZATION" or "AFFILIATE"

	var requests []struct {
		ID                int64      `db:"id" json:"id"`
		RequesterType     string     `db:"requester_type" json:"requester_type"`
		Amount            float64    `db:"amount" json:"amount"`
		BankName          string     `db:"bank_name" json:"bank_name"`
		BankAccount       string     `db:"bank_account" json:"bank_account"`
		BankAccountName   string     `db:"bank_account_name" json:"bank_account_name"`
		Notes             *string    `db:"notes" json:"notes"`
		Status            string     `db:"status" json:"status"`
		AdminNotes        *string    `db:"admin_notes" json:"admin_notes"`
		CreatedAt         time.Time  `db:"created_at" json:"created_at"`
		ProcessedAt       *time.Time `db:"processed_at" json:"processed_at"`
		PayoutStatus      string     `db:"payout_status" json:"payout_status"`
		OrgConfirmed      bool       `db:"org_confirmed" json:"org_confirmed"`
		PayoutRef         *string    `db:"payout_ref" json:"payout_ref"`
		PayoutProcessedAt *time.Time `db:"payout_processed_at" json:"payout_processed_at"`
	}

	if requesterType == "ORGANIZATION" {
		var orgID int64
		config.DB.Get(&orgID, "SELECT id FROM organizations WHERE owner_user_id = ?", userID)
		config.DB.Select(&requests, `
			SELECT id, requester_type, amount, bank_name, bank_account, bank_account_name, 
			       notes, status, admin_notes, created_at, processed_at,
			       COALESCE(payout_status, 'PENDING_PAYOUT') as payout_status,
			       COALESCE(org_confirmed, 0) as org_confirmed,
			       payout_ref, payout_processed_at
			FROM withdrawal_requests
			WHERE requester_type = 'ORGANIZATION' AND requester_id = ?
			ORDER BY created_at DESC
		`, orgID)
	} else {
		config.DB.Select(&requests, `
			SELECT id, requester_type, amount, bank_name, bank_account, bank_account_name,
			       notes, status, admin_notes, created_at, processed_at,
			       COALESCE(payout_status, 'PENDING_PAYOUT') as payout_status,
			       COALESCE(org_confirmed, 0) as org_confirmed,
			       payout_ref, payout_processed_at
			FROM withdrawal_requests
			WHERE requester_type = 'AFFILIATE' AND requester_id = ?
			ORDER BY created_at DESC
		`, userID)
	}

	if requests == nil {
		requests = make([]struct {
			ID                int64      `db:"id" json:"id"`
			RequesterType     string     `db:"requester_type" json:"requester_type"`
			Amount            float64    `db:"amount" json:"amount"`
			BankName          string     `db:"bank_name" json:"bank_name"`
			BankAccount       string     `db:"bank_account" json:"bank_account"`
			BankAccountName   string     `db:"bank_account_name" json:"bank_account_name"`
			Notes             *string    `db:"notes" json:"notes"`
			Status            string     `db:"status" json:"status"`
			AdminNotes        *string    `db:"admin_notes" json:"admin_notes"`
			CreatedAt         time.Time  `db:"created_at" json:"created_at"`
			ProcessedAt       *time.Time `db:"processed_at" json:"processed_at"`
			PayoutStatus      string     `db:"payout_status" json:"payout_status"`
			OrgConfirmed      bool       `db:"org_confirmed" json:"org_confirmed"`
			PayoutRef         *string    `db:"payout_ref" json:"payout_ref"`
			PayoutProcessedAt *time.Time `db:"payout_processed_at" json:"payout_processed_at"`
		}, 0)
	}

	c.JSON(http.StatusOK, requests)
}

// ===============================================
// ADMIN - MANAGE PAYOUT REQUESTS
// ===============================================

// GetAllWithdrawalRequests - Admin gets all withdrawal/payout requests
// GET /admin/withdrawal-requests
func GetAllWithdrawalRequests(c *gin.Context) {
	statusFilter := c.DefaultQuery("status", "")

	var requests []struct {
		ID              int64      `db:"id" json:"id"`
		RequesterType   string     `db:"requester_type" json:"requester_type"`
		RequesterID     int64      `db:"requester_id" json:"requester_id"`
		RequesterName   string     `db:"requester_name" json:"requester_name"`
		Amount          float64    `db:"amount" json:"amount"`
		BankName        string     `db:"bank_name" json:"bank_name"`
		BankAccount     string     `db:"bank_account" json:"bank_account"`
		BankAccountName string     `db:"bank_account_name" json:"bank_account_name"`
		Notes           *string    `db:"notes" json:"notes"`
		Status          string     `db:"status" json:"status"`
		AdminNotes      *string    `db:"admin_notes" json:"admin_notes"`
		CreatedAt       time.Time  `db:"created_at" json:"created_at"`
		ProcessedAt     *time.Time `db:"processed_at" json:"processed_at"`
		PayoutStatus    string     `db:"payout_status" json:"payout_status"`
		OrgConfirmed    bool       `db:"org_confirmed" json:"org_confirmed"`
		PayoutRef       *string    `db:"payout_ref" json:"payout_ref"`
	}

	query := `
		SELECT wr.id, wr.requester_type, wr.requester_id,
			CASE 
				WHEN wr.requester_type = 'ORGANIZATION' THEN (SELECT name FROM organizations WHERE id = wr.requester_id)
				ELSE (SELECT name FROM users WHERE id = wr.requester_id)
			END as requester_name,
			wr.amount, wr.bank_name, wr.bank_account, wr.bank_account_name, 
			wr.notes, wr.status, wr.admin_notes, wr.created_at, wr.processed_at,
			COALESCE(wr.payout_status, 'PENDING_PAYOUT') as payout_status,
			COALESCE(wr.org_confirmed, 0) as org_confirmed,
			wr.payout_ref
		FROM withdrawal_requests wr
	`
	if statusFilter != "" {
		query += " WHERE wr.status = ?"
		query += " ORDER BY wr.created_at DESC"
		config.DB.Select(&requests, query, statusFilter)
	} else {
		query += " ORDER BY wr.status = 'PENDING' DESC, wr.created_at DESC"
		config.DB.Select(&requests, query)
	}

	if requests == nil {
		requests = make([]struct {
			ID              int64      `db:"id" json:"id"`
			RequesterType   string     `db:"requester_type" json:"requester_type"`
			RequesterID     int64      `db:"requester_id" json:"requester_id"`
			RequesterName   string     `db:"requester_name" json:"requester_name"`
			Amount          float64    `db:"amount" json:"amount"`
			BankName        string     `db:"bank_name" json:"bank_name"`
			BankAccount     string     `db:"bank_account" json:"bank_account"`
			BankAccountName string     `db:"bank_account_name" json:"bank_account_name"`
			Notes           *string    `db:"notes" json:"notes"`
			Status          string     `db:"status" json:"status"`
			AdminNotes      *string    `db:"admin_notes" json:"admin_notes"`
			CreatedAt       time.Time  `db:"created_at" json:"created_at"`
			ProcessedAt     *time.Time `db:"processed_at" json:"processed_at"`
			PayoutStatus    string     `db:"payout_status" json:"payout_status"`
			OrgConfirmed    bool       `db:"org_confirmed" json:"org_confirmed"`
			PayoutRef       *string    `db:"payout_ref" json:"payout_ref"`
		}, 0)
	}

	c.JSON(http.StatusOK, requests)
}

// ApproveWithdrawalRequest - Admin approves payout, triggers simulasi Midtrans Iris
// PUT /admin/withdrawal-requests/:id/approve
func ApproveWithdrawalRequest(c *gin.Context) {
	adminID := c.GetInt64("user_id")
	requestID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	var input struct {
		AdminNotes string `json:"admin_notes"`
	}
	c.ShouldBindJSON(&input)

	// Get request
	var request struct {
		ID            int64   `db:"id"`
		RequesterType string  `db:"requester_type"`
		RequesterID   int64   `db:"requester_id"`
		Amount        float64 `db:"amount"`
		Status        string  `db:"status"`
		BankName      string  `db:"bank_name"`
		BankAccount   string  `db:"bank_account"`
		OrgConfirmed  bool    `db:"org_confirmed"`
	}
	err := config.DB.Get(&request, `
		SELECT id, requester_type, requester_id, amount, status, bank_name, bank_account,
		       COALESCE(org_confirmed, 0) as org_confirmed
		FROM withdrawal_requests WHERE id = ?
	`, requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request tidak ditemukan"})
		return
	}

	if request.Status != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request sudah diproses sebelumnya"})
		return
	}

	// Untuk affiliate: wajib sudah dikonfirmasi organisasi dulu
	if request.RequesterType == "AFFILIATE" && !request.OrgConfirmed {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Payout affiliate ini belum dikonfirmasi oleh organisasi. Minta organisasi untuk konfirmasi terlebih dahulu.",
		})
		return
	}

	// Verifikasi ulang saldo mencukupi (double-check sebelum payout)
	var currentBalance float64
	if request.RequesterType == "ORGANIZATION" {
		config.DB.Get(&currentBalance, `
			SELECT COALESCE(balance, 0) FROM organization_balances WHERE organization_id = ?
		`, request.RequesterID)
	} else {
		var earned, withdrawn float64
		config.DB.Get(&earned, `SELECT COALESCE(total_earned, 0) FROM affiliate_balances WHERE user_id = ?`, request.RequesterID)
		config.DB.Get(&withdrawn, `SELECT COALESCE(total_withdrawn, 0) FROM affiliate_balances WHERE user_id = ?`, request.RequesterID)
		currentBalance = earned - withdrawn
	}

	if request.Amount > currentBalance {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Saldo tidak mencukupi. Saldo saat ini: Rp %.0f, diminta: Rp %.0f", currentBalance, request.Amount),
		})
		return
	}

	tx, _ := config.DB.Beginx()

	// Kurangi saldo
	if request.RequesterType == "ORGANIZATION" {
		_, err = tx.Exec(`
			UPDATE organization_balances 
			SET balance = balance - ?, total_withdrawn = total_withdrawn + ?
			WHERE organization_id = ?
		`, request.Amount, request.Amount, request.RequesterID)
	} else {
		_, err = tx.Exec(`
			UPDATE affiliate_balances 
			SET total_withdrawn = total_withdrawn + ?
			WHERE user_id = ?
		`, request.Amount, request.RequesterID)
	}
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update saldo"})
		return
	}

	// Update status ke APPROVED dan payout_status ke PROCESSING
	payoutRef := fmt.Sprintf("IRIS-%d-%d%02d", requestID, time.Now().Unix(), rand.Intn(99))
	_, err = tx.Exec(`
		UPDATE withdrawal_requests 
		SET status = 'APPROVED', admin_notes = ?, processed_at = NOW(), processed_by = ?,
		    payout_status = 'PROCESSING', payout_ref = ?
		WHERE id = ?
	`, input.AdminNotes, adminID, payoutRef, requestID)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update status"})
		return
	}

	tx.Commit()

	// Catat financial transaction
	config.DB.Exec(`
		INSERT INTO financial_transactions (transaction_type, entity_type, entity_id, amount, description, reference_id)
		VALUES ('WITHDRAWAL', ?, ?, ?, ?, ?)
	`,
		func() string {
			if request.RequesterType == "ORGANIZATION" {
				return "ORGANIZATION"
			}
			return "AFFILIATE"
		}(),
		request.RequesterID,
		request.Amount,
		fmt.Sprintf("Payout ke %s (%s) - Ref: %s", request.BankName, request.BankAccount, payoutRef),
		payoutRef,
	)

	// Notify requester: payout PROCESSING
	var notifyUserID int64
	if request.RequesterType == "ORGANIZATION" {
		config.DB.Get(&notifyUserID, "SELECT owner_user_id FROM organizations WHERE id = ?", request.RequesterID)
	} else {
		notifyUserID = request.RequesterID
	}
	CreateNotification(
		notifyUserID,
		"payout_processing",
		"⏳ Payout Sedang Diproses",
		fmt.Sprintf("Payout Rp %.0f sedang diproses ke %s (%s). Ref: %s", request.Amount, request.BankName, request.BankAccount, payoutRef),
	)

	// ==================================================
	// SIMULASI MIDTRANS IRIS: Goroutine selesaikan payout
	// Dalam 5 detik, payout_status berubah ke COMPLETED
	// ==================================================
	go func(reqID int64, notifyUID int64, amount float64, bankName string, ref string) {
		time.Sleep(5 * time.Second)

		config.DB.Exec(`
			UPDATE withdrawal_requests 
			SET payout_status = 'COMPLETED', payout_processed_at = NOW()
			WHERE id = ?
		`, reqID)

		CreateNotification(
			notifyUID,
			"payout_completed",
			"✅ Payout Berhasil!",
			fmt.Sprintf("Payout Rp %.0f ke %s telah berhasil dikirim. Ref: %s", amount, bankName, ref),
		)

		fmt.Printf("[IRIS-SIMULATE] ✅ Payout #%d COMPLETED - Ref: %s\n", reqID, ref)
	}(requestID, notifyUserID, request.Amount, request.BankName, payoutRef)

	c.JSON(http.StatusOK, gin.H{
		"message":    "Payout disetujui dan sedang diproses",
		"payout_ref": payoutRef,
		"status":     "PROCESSING",
	})
}

// RejectWithdrawalRequest - Admin rejects payout request
// PUT /admin/withdrawal-requests/:id/reject
func RejectWithdrawalRequest(c *gin.Context) {
	adminID := c.GetInt64("user_id")
	requestID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	var input struct {
		AdminNotes string `json:"admin_notes" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Berikan alasan penolakan"})
		return
	}

	var request struct {
		RequesterType string  `db:"requester_type"`
		RequesterID   int64   `db:"requester_id"`
		Amount        float64 `db:"amount"`
		Status        string  `db:"status"`
	}
	err := config.DB.Get(&request, "SELECT requester_type, requester_id, amount, status FROM withdrawal_requests WHERE id = ?", requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request tidak ditemukan"})
		return
	}

	if request.Status != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request sudah diproses sebelumnya"})
		return
	}

	config.DB.Exec(`
		UPDATE withdrawal_requests 
		SET status = 'REJECTED', admin_notes = ?, processed_at = NOW(), processed_by = ?,
		    payout_status = 'FAILED'
		WHERE id = ?
	`, input.AdminNotes, adminID, requestID)

	// Notify requester
	var notifyUserID int64
	if request.RequesterType == "ORGANIZATION" {
		config.DB.Get(&notifyUserID, "SELECT owner_user_id FROM organizations WHERE id = ?", request.RequesterID)
	} else {
		notifyUserID = request.RequesterID
	}
	CreateNotification(
		notifyUserID,
		"payout_rejected",
		"❌ Payout Ditolak",
		fmt.Sprintf("Payout sebesar Rp %.0f ditolak admin. Alasan: %s", request.Amount, input.AdminNotes),
	)

	c.JSON(http.StatusOK, gin.H{"message": "Payout ditolak"})
}
