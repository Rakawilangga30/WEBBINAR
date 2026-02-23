package controllers

import (
	"net/http"
	"time"

	"BACKEND/config"

	"github.com/gin-gonic/gin"
)

// ===============================================
// ANALYTICS CONTROLLER
// Statistik & Laporan untuk Admin, Org, Affiliate
// ===============================================

// -----------------------------------------------
// ADMIN ANALYTICS
// GET /admin/analytics
// -----------------------------------------------
func GetAdminAnalytics(c *gin.Context) {
	type TopEvent struct {
		ID         int64   `db:"id" json:"id"`
		Title      string  `db:"title" json:"title"`
		OrgName    string  `db:"org_name" json:"org_name"`
		TotalBuyer int     `db:"total_buyer" json:"total_buyer"`
		Revenue    float64 `db:"revenue" json:"revenue"`
	}

	type TopOrg struct {
		ID      int64   `db:"id" json:"id"`
		Name    string  `db:"name" json:"name"`
		Revenue float64 `db:"revenue" json:"revenue"`
		Events  int     `db:"events" json:"events"`
		Buyers  int     `db:"buyers" json:"buyers"`
	}

	type TopAffiliate struct {
		Code       string  `db:"code" json:"code"`
		UserName   string  `db:"user_name" json:"user_name"`
		EventTitle string  `db:"event_title" json:"event_title"`
		TotalUse   int     `db:"total_use" json:"total_use"`
		Commission float64 `db:"commission" json:"commission"`
	}

	type WithdrawalItem struct {
		ID            int64     `db:"id" json:"id"`
		RequesterName string    `db:"requester_name" json:"requester_name"`
		Type          string    `db:"type" json:"type"`
		Amount        float64   `db:"amount" json:"amount"`
		Status        string    `db:"status" json:"status"`
		BankName      string    `db:"bank_name" json:"bank_name"`
		BankAccount   string    `db:"bank_account" json:"bank_account"`
		CreatedAt     time.Time `db:"created_at" json:"created_at"`
	}

	// KPI Totals
	var totalRevenue float64
	config.DB.Get(&totalRevenue, `SELECT COALESCE(SUM(price_paid),0) FROM purchases WHERE status = 'PAID'`)

	var totalTransactions int
	config.DB.Get(&totalTransactions, `SELECT COUNT(*) FROM purchases WHERE status = 'PAID'`)

	var totalUsers int
	config.DB.Get(&totalUsers, `SELECT COUNT(*) FROM users`)

	var totalOrgs int
	config.DB.Get(&totalOrgs, `SELECT COUNT(*) FROM organizations`)

	// Top 10 Events by Buyers
	var topEvents []TopEvent
	config.DB.Select(&topEvents, `
		SELECT 
			e.id, e.title,
			COALESCE(o.name, 'Official') as org_name,
			COUNT(DISTINCT p.user_id) as total_buyer,
			COALESCE(SUM(p.price_paid), 0) as revenue
		FROM events e
		JOIN sessions s ON s.event_id = e.id
		JOIN purchases p ON p.session_id = s.id
		LEFT JOIN organizations o ON e.organization_id = o.id
		WHERE p.status = 'PAID'
		GROUP BY e.id, e.title, o.name
		ORDER BY total_buyer DESC
		LIMIT 10
	`)
	if topEvents == nil {
		topEvents = []TopEvent{}
	}

	// Top 10 Orgs by Revenue
	var topOrgs []TopOrg
	config.DB.Select(&topOrgs, `
		SELECT 
			o.id, o.name,
			COALESCE(SUM(p.price_paid), 0) as revenue,
			COUNT(DISTINCT e.id) as events,
			COUNT(DISTINCT p.user_id) as buyers
		FROM organizations o
		JOIN events e ON e.organization_id = o.id
		JOIN sessions s ON s.event_id = e.id
		JOIN purchases p ON p.session_id = s.id
		WHERE p.status = 'PAID'
		GROUP BY o.id, o.name
		ORDER BY revenue DESC
		LIMIT 10
	`)
	if topOrgs == nil {
		topOrgs = []TopOrg{}
	}

	// Top 10 Affiliate Codes by Usage
	var topAffiliates []TopAffiliate
	config.DB.Select(&topAffiliates, `
		SELECT 
			ap.unique_code as code,
			u.name as user_name,
			e.title as event_title,
			COUNT(p.id) as total_use,
			COALESCE(SUM(p.price_paid * ap.commission_percentage / 100), 0) as commission
		FROM affiliate_partnerships ap
		JOIN users u ON ap.user_id = u.id
		JOIN events e ON ap.event_id = e.id
		LEFT JOIN purchases p ON p.affiliate_code = ap.unique_code AND p.status = 'PAID'
		WHERE ap.status = 'APPROVED'
		GROUP BY ap.unique_code, u.name, e.title, ap.commission_percentage
		ORDER BY total_use DESC
		LIMIT 10
	`)
	if topAffiliates == nil {
		topAffiliates = []TopAffiliate{}
	}

	// Recent Withdrawals (org + affiliate combined)
	var recentWithdrawals []WithdrawalItem
	config.DB.Select(&recentWithdrawals, `
		SELECT 
			wr.id,
			COALESCE(u.name, 'Unknown') as requester_name,
			'ORGANIZATION' as type,
			wr.amount,
			wr.status,
			COALESCE(wr.bank_name, '') as bank_name,
			COALESCE(wr.bank_account, '') as bank_account,
			wr.created_at
		FROM withdrawal_requests wr
		JOIN users u ON wr.user_id = u.id
		ORDER BY wr.created_at DESC
		LIMIT 20
	`)
	if recentWithdrawals == nil {
		recentWithdrawals = []WithdrawalItem{}
	}

	c.JSON(http.StatusOK, gin.H{
		"kpi": gin.H{
			"total_revenue":      totalRevenue,
			"total_transactions": totalTransactions,
			"total_users":        totalUsers,
			"total_orgs":         totalOrgs,
		},
		"top_events":         topEvents,
		"top_orgs":           topOrgs,
		"top_affiliates":     topAffiliates,
		"recent_withdrawals": recentWithdrawals,
	})
}

// -----------------------------------------------
// ORGANIZATION ANALYTICS
// GET /organization/analytics
// -----------------------------------------------
func GetOrgAnalytics(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var orgID int64
	err := config.DB.Get(&orgID, "SELECT id FROM organizations WHERE owner_user_id = ?", userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organisasi tidak ditemukan"})
		return
	}

	type TopEvent struct {
		ID      int64   `db:"id" json:"id"`
		Title   string  `db:"title" json:"title"`
		Buyers  int     `db:"buyers" json:"buyers"`
		Revenue float64 `db:"revenue" json:"revenue"`
	}

	type TopAffiliate struct {
		Code       string  `db:"code" json:"code"`
		UserName   string  `db:"user_name" json:"user_name"`
		EventTitle string  `db:"event_title" json:"event_title"`
		TotalUse   int     `db:"total_use" json:"total_use"`
		Commission float64 `db:"commission" json:"commission"`
		CommPct    float64 `db:"comm_pct" json:"comm_pct"`
	}

	type WithdrawalItem struct {
		ID          int64     `db:"id" json:"id"`
		Name        string    `db:"name" json:"name"`
		Type        string    `db:"type" json:"type"`
		Amount      float64   `db:"amount" json:"amount"`
		Status      string    `db:"status" json:"status"`
		BankName    string    `db:"bank_name" json:"bank_name"`
		BankAccount string    `db:"bank_account" json:"bank_account"`
		CreatedAt   time.Time `db:"created_at" json:"created_at"`
	}

	// KPI
	var totalRevenue float64
	config.DB.Get(&totalRevenue, `
		SELECT COALESCE(SUM(p.price_paid), 0)
		FROM purchases p
		JOIN sessions s ON p.session_id = s.id
		JOIN events e ON s.event_id = e.id
		WHERE e.organization_id = ? AND p.status = 'PAID'
	`, orgID)

	var totalBuyers int
	config.DB.Get(&totalBuyers, `
		SELECT COUNT(DISTINCT p.user_id)
		FROM purchases p
		JOIN sessions s ON p.session_id = s.id
		JOIN events e ON s.event_id = e.id
		WHERE e.organization_id = ? AND p.status = 'PAID'
	`, orgID)

	var totalSessions int
	config.DB.Get(&totalSessions, `
		SELECT COUNT(p.id)
		FROM purchases p
		JOIN sessions s ON p.session_id = s.id
		JOIN events e ON s.event_id = e.id
		WHERE e.organization_id = ? AND p.status = 'PAID'
	`, orgID)

	var totalCommission float64
	config.DB.Get(&totalCommission, `
		SELECT COALESCE(SUM(p.price_paid * ap.commission_percentage / 100), 0)
		FROM purchases p
		JOIN affiliate_partnerships ap ON p.affiliate_code = ap.unique_code
		JOIN sessions s ON p.session_id = s.id
		JOIN events e ON s.event_id = e.id
		WHERE e.organization_id = ? AND p.status = 'PAID' AND ap.organization_id = ?
	`, orgID, orgID)

	netRevenue := totalRevenue - totalCommission

	// Top Events by Buyers
	var topEvents []TopEvent
	config.DB.Select(&topEvents, `
		SELECT 
			e.id, e.title,
			COUNT(DISTINCT p.user_id) as buyers,
			COALESCE(SUM(p.price_paid), 0) as revenue
		FROM events e
		JOIN sessions s ON s.event_id = e.id
		JOIN purchases p ON p.session_id = s.id
		WHERE e.organization_id = ? AND p.status = 'PAID'
		GROUP BY e.id, e.title
		ORDER BY buyers DESC
		LIMIT 10
	`, orgID)
	if topEvents == nil {
		topEvents = []TopEvent{}
	}

	// Top Affiliate Codes by Usage
	var topAffiliates []TopAffiliate
	config.DB.Select(&topAffiliates, `
		SELECT 
			ap.unique_code as code,
			u.name as user_name,
			e.title as event_title,
			COUNT(p.id) as total_use,
			COALESCE(SUM(p.price_paid * ap.commission_percentage / 100), 0) as commission,
			ap.commission_percentage as comm_pct
		FROM affiliate_partnerships ap
		JOIN users u ON ap.user_id = u.id
		JOIN events e ON ap.event_id = e.id
		LEFT JOIN purchases p ON p.affiliate_code = ap.unique_code AND p.status = 'PAID'
		WHERE ap.organization_id = ? AND ap.status = 'APPROVED'
		GROUP BY ap.unique_code, u.name, e.title, ap.commission_percentage
		ORDER BY total_use DESC
		LIMIT 10
	`, orgID)
	if topAffiliates == nil {
		topAffiliates = []TopAffiliate{}
	}

	// Recent Withdrawals (org's own + affiliate withdrawals from this org)
	var recentWithdrawals []WithdrawalItem
	config.DB.Select(&recentWithdrawals, `
		SELECT 
			wr.id,
			COALESCE(u.name, 'Unknown') as name,
			'ORGANIZATION' as type,
			wr.amount,
			wr.status,
			COALESCE(wr.bank_name, '') as bank_name,
			COALESCE(wr.bank_account, '') as bank_account,
			wr.created_at
		FROM withdrawal_requests wr
		JOIN users u ON wr.user_id = u.id
		WHERE u.id = (SELECT owner_user_id FROM organizations WHERE id = ?)
		ORDER BY wr.created_at DESC
		LIMIT 15
	`, orgID)
	if recentWithdrawals == nil {
		recentWithdrawals = []WithdrawalItem{}
	}

	c.JSON(http.StatusOK, gin.H{
		"kpi": gin.H{
			"total_revenue":    totalRevenue,
			"total_buyers":     totalBuyers,
			"total_sessions":   totalSessions,
			"total_commission": totalCommission,
			"net_revenue":      netRevenue,
		},
		"top_events":         topEvents,
		"top_affiliates":     topAffiliates,
		"recent_withdrawals": recentWithdrawals,
	})
}

// -----------------------------------------------
// AFFILIATE ANALYTICS
// GET /affiliate/analytics
// -----------------------------------------------
func GetAffiliateAnalytics(c *gin.Context) {
	userID := c.GetInt64("user_id")

	type CodeStat struct {
		Code       string  `db:"code" json:"code"`
		EventTitle string  `db:"event_title" json:"event_title"`
		OrgName    string  `db:"org_name" json:"org_name"`
		TotalUse   int     `db:"total_use" json:"total_use"`
		TotalSales float64 `db:"total_sales" json:"total_sales"`
		Commission float64 `db:"commission" json:"commission"`
		CommPct    float64 `db:"comm_pct" json:"comm_pct"`
		IsActive   bool    `db:"is_active" json:"is_active"`
		Status     string  `db:"status" json:"status"`
	}

	type RecentSale struct {
		PurchaseID   int64     `db:"purchase_id" json:"purchase_id"`
		BuyerName    string    `db:"buyer_name" json:"buyer_name"`
		EventTitle   string    `db:"event_title" json:"event_title"`
		SessionTitle string    `db:"session_title" json:"session_title"`
		Amount       float64   `db:"amount" json:"amount"`
		Commission   float64   `db:"commission" json:"commission"`
		Code         string    `db:"code" json:"code"`
		PurchasedAt  time.Time `db:"purchased_at" json:"purchased_at"`
	}

	type WithdrawalItem struct {
		ID          int64     `db:"id" json:"id"`
		Amount      float64   `db:"amount" json:"amount"`
		Status      string    `db:"status" json:"status"`
		BankName    string    `db:"bank_name" json:"bank_name"`
		BankAccount string    `db:"bank_account" json:"bank_account"`
		CreatedAt   time.Time `db:"created_at" json:"created_at"`
	}

	// KPI
	var totalCommission float64
	config.DB.Get(&totalCommission, `
		SELECT COALESCE(SUM(p.price_paid * ap.commission_percentage / 100), 0)
		FROM purchases p
		JOIN affiliate_partnerships ap ON p.affiliate_code = ap.unique_code
		WHERE ap.user_id = ? AND p.status = 'PAID'
	`, userID)

	var totalBuyers int
	config.DB.Get(&totalBuyers, `
		SELECT COUNT(DISTINCT p.user_id)
		FROM purchases p
		JOIN affiliate_partnerships ap ON p.affiliate_code = ap.unique_code
		WHERE ap.user_id = ? AND p.status = 'PAID'
	`, userID)

	var activeCodes int
	config.DB.Get(&activeCodes, `
		SELECT COUNT(*) FROM affiliate_partnerships
		WHERE user_id = ? AND status = 'APPROVED' AND COALESCE(is_active, 1) = 1
	`, userID)

	// Per-code stats
	var codeStats []CodeStat
	config.DB.Select(&codeStats, `
		SELECT 
			ap.unique_code as code,
			e.title as event_title,
			COALESCE(o.name, 'Official') as org_name,
			COUNT(p.id) as total_use,
			COALESCE(SUM(p.price_paid), 0) as total_sales,
			COALESCE(SUM(p.price_paid * ap.commission_percentage / 100), 0) as commission,
			ap.commission_percentage as comm_pct,
			COALESCE(ap.is_active, 1) as is_active,
			ap.status
		FROM affiliate_partnerships ap
		JOIN events e ON ap.event_id = e.id
		LEFT JOIN organizations o ON e.organization_id = o.id
		LEFT JOIN purchases p ON p.affiliate_code = ap.unique_code AND p.status = 'PAID'
		WHERE ap.user_id = ?
		GROUP BY ap.unique_code, e.title, o.name, ap.commission_percentage, ap.is_active, ap.status
		ORDER BY total_use DESC
	`, userID)
	if codeStats == nil {
		codeStats = []CodeStat{}
	}

	// Recent sales using affiliate codes
	var recentSales []RecentSale
	config.DB.Select(&recentSales, `
		SELECT 
			p.id as purchase_id,
			COALESCE(u.name, 'Unknown') as buyer_name,
			e.title as event_title,
			s.title as session_title,
			p.price_paid as amount,
			COALESCE(p.price_paid * ap.commission_percentage / 100, 0) as commission,
			p.affiliate_code as code,
			p.created_at as purchased_at
		FROM purchases p
		JOIN affiliate_partnerships ap ON p.affiliate_code = ap.unique_code
		JOIN users u ON p.user_id = u.id
		JOIN sessions s ON p.session_id = s.id
		JOIN events e ON s.event_id = e.id
		WHERE ap.user_id = ? AND p.status = 'PAID'
		ORDER BY p.created_at DESC
		LIMIT 20
	`, userID)
	if recentSales == nil {
		recentSales = []RecentSale{}
	}

	// Withdrawal history
	var withdrawals []WithdrawalItem
	config.DB.Select(&withdrawals, `
		SELECT 
			wr.id,
			wr.amount,
			wr.status,
			COALESCE(wr.bank_name, '') as bank_name,
			COALESCE(wr.bank_account, '') as bank_account,
			wr.created_at
		FROM withdrawal_requests wr
		WHERE wr.user_id = ?
		ORDER BY wr.created_at DESC
		LIMIT 10
	`, userID)
	if withdrawals == nil {
		withdrawals = []WithdrawalItem{}
	}

	c.JSON(http.StatusOK, gin.H{
		"kpi": gin.H{
			"total_commission": totalCommission,
			"total_buyers":     totalBuyers,
			"active_codes":     activeCodes,
		},
		"code_stats":   codeStats,
		"recent_sales": recentSales,
		"withdrawals":  withdrawals,
	})
}
