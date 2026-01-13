package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"BACKEND/config"

	"github.com/gin-gonic/gin"
)

// ===============================================
// WITHDRAWAL REQUEST CONTROLLER
// Centralized withdrawal system - all go to admin
// ===============================================

// RequestOrgWithdrawal - Organization requests withdrawal
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
		fmt.Printf("[ORG-WITHDRAW] Organization not found for user %d: %v\n", userID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Organisasi tidak ditemukan"})
		return
	}

	// Get balance from organization_balances table
	var balance float64
	config.DB.Get(&balance, `
		SELECT COALESCE(balance, 0) FROM organization_balances WHERE organization_id = ?
	`, org.ID)

	fmt.Printf("[ORG-WITHDRAW] orgID=%d, name=%s, balance=%.0f\n", org.ID, org.Name, balance)

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

	// Validate amount
	if input.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jumlah penarikan harus lebih dari 0"})
		return
	}
	if input.Amount > balance {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Saldo tidak cukup. Saldo Anda: Rp %.0f", balance)})
		return
	}

	// Check if already has an active (PENDING or APPROVED) request this month
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah memiliki permintaan penarikan aktif bulan ini. Tunggu hingga diproses atau bulan depan."})
		return
	}

	// Check total attempts this month (max 7, including rejected)
	var totalAttempts int
	config.DB.Get(&totalAttempts, `
		SELECT COUNT(*) FROM withdrawal_requests 
		WHERE requester_type = 'ORGANIZATION' 
		AND requester_id = ? 
		AND MONTH(created_at) = MONTH(NOW()) 
		AND YEAR(created_at) = YEAR(NOW())
	`, org.ID)
	if totalAttempts >= 7 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah mencapai batas maksimal 7 percobaan penarikan bulan ini."})
		return
	}

	// Insert withdrawal request
	_, err = config.DB.Exec(`
		INSERT INTO withdrawal_requests (requester_type, requester_id, amount, bank_name, bank_account, bank_account_name, notes)
		VALUES ('ORGANIZATION', ?, ?, ?, ?, ?, ?)
	`, org.ID, input.Amount, input.BankName, input.BankAccount, input.BankAccountName, input.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengajukan penarikan: " + err.Error()})
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
			"withdrawal_request",
			"💰 Permintaan Penarikan Baru",
			fmt.Sprintf("Organisasi \"%s\" mengajukan penarikan Rp %.0f", org.Name, input.Amount),
		)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permintaan penarikan berhasil diajukan. Menunggu persetujuan admin."})
}

// RequestAffiliateWithdrawal - Affiliate requests withdrawal
// POST /affiliate/withdrawal-request
func RequestAffiliateWithdrawal(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Get affiliate balance from affiliate_balances table (same as GetAffiliateBalance)
	var balanceData struct {
		TotalEarned    float64 `db:"total_earned"`
		TotalWithdrawn float64 `db:"total_withdrawn"`
	}
	err := config.DB.Get(&balanceData, `
		SELECT COALESCE(total_earned, 0) as total_earned, 
		       COALESCE(total_withdrawn, 0) as total_withdrawn
		FROM affiliate_balances WHERE user_id = ?
	`, userID)

	// Calculate available balance
	var availableBalance float64
	if err != nil {
		// No balance record yet - calculate from ledger
		config.DB.Get(&availableBalance, `
			SELECT COALESCE(SUM(al.affiliate_amount), 0)
			FROM affiliate_ledgers al
			JOIN affiliate_submissions asub ON al.affiliate_submission_id = asub.id
			WHERE asub.user_id = ?
		`, userID)
	} else {
		availableBalance = balanceData.TotalEarned - balanceData.TotalWithdrawn
	}

	fmt.Printf("[AFFILIATE-WITHDRAW] userID=%d, available_balance=%.0f\n", userID, availableBalance)

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

	// Validate amount
	if input.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jumlah penarikan harus lebih dari 0"})
		return
	}
	if input.Amount > availableBalance {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Saldo tidak cukup. Saldo Anda: Rp %.0f", availableBalance)})
		return
	}

	// Check if already has an active (PENDING or APPROVED) request this month
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah memiliki permintaan penarikan aktif bulan ini. Tunggu hingga diproses atau bulan depan."})
		return
	}

	// Check total attempts this month (max 7, including rejected)
	var totalAttempts int
	config.DB.Get(&totalAttempts, `
		SELECT COUNT(*) FROM withdrawal_requests 
		WHERE requester_type = 'AFFILIATE' 
		AND requester_id = ? 
		AND MONTH(created_at) = MONTH(NOW()) 
		AND YEAR(created_at) = YEAR(NOW())
	`, userID)
	if totalAttempts >= 7 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah mencapai batas maksimal 7 percobaan penarikan bulan ini."})
		return
	}

	// Insert withdrawal request
	_, err = config.DB.Exec(`
		INSERT INTO withdrawal_requests (requester_type, requester_id, amount, bank_name, bank_account, bank_account_name, notes)
		VALUES ('AFFILIATE', ?, ?, ?, ?, ?, ?)
	`, userID, input.Amount, input.BankName, input.BankAccount, input.BankAccountName, input.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengajukan penarikan: " + err.Error()})
		return
	}

	// Notify admins
	var userName string
	config.DB.Get(&userName, "SELECT name FROM users WHERE id = ?", userID)
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
			"withdrawal_request",
			"💰 Permintaan Penarikan Affiliate",
			fmt.Sprintf("Affiliate \"%s\" mengajukan penarikan Rp %.0f", userName, input.Amount),
		)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permintaan penarikan berhasil diajukan. Menunggu persetujuan admin."})
}

// GetMyWithdrawalRequests - Get user's withdrawal requests
// GET /user/withdrawal-requests (for both org and affiliate)
func GetMyWithdrawalRequests(c *gin.Context) {
	userID := c.GetInt64("user_id")
	requesterType := c.Query("type") // "ORGANIZATION" or "AFFILIATE"

	var requests []struct {
		ID              int64      `db:"id" json:"id"`
		RequesterType   string     `db:"requester_type" json:"requester_type"`
		Amount          float64    `db:"amount" json:"amount"`
		BankName        string     `db:"bank_name" json:"bank_name"`
		BankAccount     string     `db:"bank_account" json:"bank_account"`
		BankAccountName string     `db:"bank_account_name" json:"bank_account_name"`
		Notes           *string    `db:"notes" json:"notes"`
		Status          string     `db:"status" json:"status"`
		AdminNotes      *string    `db:"admin_notes" json:"admin_notes"`
		CreatedAt       time.Time  `db:"created_at" json:"created_at"`
		ProcessedAt     *time.Time `db:"processed_at" json:"processed_at"`
	}

	if requesterType == "ORGANIZATION" {
		var orgID int64
		config.DB.Get(&orgID, "SELECT id FROM organizations WHERE owner_user_id = ?", userID)
		config.DB.Select(&requests, `
			SELECT id, requester_type, amount, bank_name, bank_account, bank_account_name, notes, status, admin_notes, created_at, processed_at
			FROM withdrawal_requests
			WHERE requester_type = 'ORGANIZATION' AND requester_id = ?
			ORDER BY created_at DESC
		`, orgID)
	} else {
		config.DB.Select(&requests, `
			SELECT id, requester_type, amount, bank_name, bank_account, bank_account_name, notes, status, admin_notes, created_at, processed_at
			FROM withdrawal_requests
			WHERE requester_type = 'AFFILIATE' AND requester_id = ?
			ORDER BY created_at DESC
		`, userID)
	}

	if requests == nil {
		requests = make([]struct {
			ID              int64      `db:"id" json:"id"`
			RequesterType   string     `db:"requester_type" json:"requester_type"`
			Amount          float64    `db:"amount" json:"amount"`
			BankName        string     `db:"bank_name" json:"bank_name"`
			BankAccount     string     `db:"bank_account" json:"bank_account"`
			BankAccountName string     `db:"bank_account_name" json:"bank_account_name"`
			Notes           *string    `db:"notes" json:"notes"`
			Status          string     `db:"status" json:"status"`
			AdminNotes      *string    `db:"admin_notes" json:"admin_notes"`
			CreatedAt       time.Time  `db:"created_at" json:"created_at"`
			ProcessedAt     *time.Time `db:"processed_at" json:"processed_at"`
		}, 0)
	}

	c.JSON(http.StatusOK, requests)
}

// ===============================================
// ADMIN - MANAGE WITHDRAWAL REQUESTS
// ===============================================

// GetAllWithdrawalRequests - Admin gets all withdrawal requests
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
	}

	query := `
		SELECT wr.id, wr.requester_type, wr.requester_id,
			CASE 
				WHEN wr.requester_type = 'ORGANIZATION' THEN (SELECT name FROM organizations WHERE id = wr.requester_id)
				ELSE (SELECT name FROM users WHERE id = wr.requester_id)
			END as requester_name,
			wr.amount, wr.bank_name, wr.bank_account, wr.bank_account_name, 
			wr.notes, wr.status, wr.admin_notes, wr.created_at, wr.processed_at
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
		}, 0)
	}

	c.JSON(http.StatusOK, requests)
}

// ApproveWithdrawalRequest - Admin approves withdrawal
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
	}
	err := config.DB.Get(&request, "SELECT id, requester_type, requester_id, amount, status FROM withdrawal_requests WHERE id = ?", requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request tidak ditemukan"})
		return
	}

	if request.Status != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request sudah diproses sebelumnya"})
		return
	}

	tx, _ := config.DB.Beginx()

	// Deduct balance
	if request.RequesterType == "ORGANIZATION" {
		// Update organization_balances table
		_, err = tx.Exec(`
			UPDATE organization_balances 
			SET balance = balance - ?, total_withdrawn = total_withdrawn + ?
			WHERE organization_id = ?
		`, request.Amount, request.Amount, request.RequesterID)
	} else {
		// Update affiliate_balances table
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

	// Update request status
	_, err = tx.Exec(`
		UPDATE withdrawal_requests 
		SET status = 'APPROVED', admin_notes = ?, processed_at = NOW(), processed_by = ?
		WHERE id = ?
	`, input.AdminNotes, adminID, requestID)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update status"})
		return
	}

	tx.Commit()

	// Notify requester
	var notifyUserID int64
	if request.RequesterType == "ORGANIZATION" {
		config.DB.Get(&notifyUserID, "SELECT owner_user_id FROM organizations WHERE id = ?", request.RequesterID)
	} else {
		notifyUserID = request.RequesterID
	}
	CreateNotification(
		notifyUserID,
		"withdrawal_approved",
		"✅ Penarikan Disetujui",
		fmt.Sprintf("Penarikan sebesar Rp %.0f telah disetujui dan sedang diproses.", request.Amount),
	)

	c.JSON(http.StatusOK, gin.H{"message": "Penarikan disetujui"})
}

// RejectWithdrawalRequest - Admin rejects withdrawal
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
		SET status = 'REJECTED', admin_notes = ?, processed_at = NOW(), processed_by = ?
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
		"withdrawal_rejected",
		"❌ Penarikan Ditolak",
		fmt.Sprintf("Penarikan sebesar Rp %.0f ditolak. Alasan: %s", request.Amount, input.AdminNotes),
	)

	c.JSON(http.StatusOK, gin.H{"message": "Penarikan ditolak"})
}
