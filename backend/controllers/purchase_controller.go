package controllers

import (
	"strconv"

	"BACKEND/config"

	"github.com/gin-gonic/gin"
)

// =============================
// BUY SESSION
// =============================
func BuySession(c *gin.Context) {

	userID := c.GetInt64("user_id")
	sessionIDstr := c.Param("sessionID")

	sessionID, err := strconv.ParseInt(sessionIDstr, 10, 64)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid session ID"})
		return
	}

	// Check session exists and published
	var price float64
	var publishStatus string

	err = config.DB.Get(&price, `
		SELECT price FROM sessions WHERE id = ?
	`, sessionID)
	if err != nil {
		c.JSON(404, gin.H{"error": "Session not found"})
		return
	}

	err = config.DB.Get(&publishStatus, `
		SELECT publish_status FROM sessions WHERE id = ?
	`, sessionID)
	if err != nil || publishStatus != "PUBLISHED" {
		c.JSON(403, gin.H{"error": "Session is not published"})
		return
	}

	// Check if user already bought session
	var count int
	config.DB.Get(&count, `
		SELECT COUNT(*) FROM purchases 
		WHERE user_id = ? AND session_id = ?
	`, userID, sessionID)

	if count > 0 {
		c.JSON(400, gin.H{"error": "You already purchased this session"})
		return
	}

	// Insert new purchase record - FREE sessions get PAID status immediately
	status := "PAID" // For free sessions, mark as PAID immediately
	if price > 0 {
		status = "PENDING" // For paid sessions, will be updated by Midtrans webhook
	}

	_, err = config.DB.Exec(`
		INSERT INTO purchases (user_id, session_id, price_paid, status) 
		VALUES (?, ?, ?, ?)
	`, userID, sessionID, price, status)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to complete purchase"})
		return
	}

	// Notify organization owner about the purchase
	go func() {
		// Get session and event info
		var sessionInfo struct {
			SessionTitle string `db:"session_title"`
			EventTitle   string `db:"event_title"`
			OwnerID      int64  `db:"owner_id"`
		}
		config.DB.Get(&sessionInfo, `
			SELECT s.title as session_title, e.title as event_title, o.owner_user_id as owner_id
			FROM sessions s
			JOIN events e ON s.event_id = e.id
			JOIN organizations o ON e.organization_id = o.id
			WHERE s.id = ?
		`, sessionID)

		// Get buyer name
		var buyerName string
		config.DB.Get(&buyerName, "SELECT name FROM users WHERE id = ?", userID)

		if sessionInfo.OwnerID > 0 {
			CreateNotification(
				sessionInfo.OwnerID,
				"new_purchase",
				"💰 Pembelian Baru!",
				buyerName+" membeli sesi \""+sessionInfo.SessionTitle+"\" dari event \""+sessionInfo.EventTitle+"\"",
			)
		}
	}()

	c.JSON(200, gin.H{
		"message":    "Purchase successful",
		"session_id": sessionID,
		"price_paid": price,
	})
}

// =============================
// LIST PURCHASED SESSIONS
// =============================
func MyPurchases(c *gin.Context) {

	userID := c.GetInt64("user_id")

	var purchases []struct {
		PurchaseID   int64   `db:"id" json:"id"`
		SessionID    int64   `db:"session_id" json:"session_id"`
		SessionTitle string  `db:"session_title" json:"session_title"`
		PricePaid    float64 `db:"price_paid" json:"price_paid"`
		EventID      int64   `db:"event_id" json:"event_id"`
		EventTitle   string  `db:"event_title" json:"event_title"`
		EventThumb   *string `db:"thumbnail_url" json:"thumbnail_url"`
	}

	// Return purchases with session + event info so frontend dapat menampilkan grouped view
	err := config.DB.Select(&purchases, `
		SELECT p.id, p.session_id, s.title as session_title, p.price_paid,
			   e.id as event_id, e.title as event_title, e.thumbnail_url
		FROM purchases p
		JOIN sessions s ON p.session_id = s.id
		JOIN events e ON s.event_id = e.id
		WHERE p.user_id = ? AND p.status = 'PAID'
		ORDER BY p.purchased_at DESC
	`, userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to load purchased sessions"})
		return
	}

	c.JSON(200, gin.H{"purchases": purchases})
}

// =============================
// CHECK SESSION PURCHASE STATUS
// =============================
func CheckSessionPurchase(c *gin.Context) {

	userID := c.GetInt64("user_id")
	sessionIDstr := c.Param("sessionID")

	sessionID, err := strconv.ParseInt(sessionIDstr, 10, 64)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid session ID"})
		return
	}

	// 1. Cek sesi ada atau tidak (opsional, agar response rapi)
	var sessionTitle string
	err = config.DB.Get(&sessionTitle, "SELECT title FROM sessions WHERE id = ?", sessionID)
	if err != nil {
		c.JSON(404, gin.H{"error": "Session not found"})
		return
	}

	// 2. Cek apakah user sudah membeli DAN status PAID
	var count int
	err = config.DB.Get(&count, `
		SELECT COUNT(*) FROM purchases 
		WHERE user_id = ? AND session_id = ? AND status = 'PAID'
	`, userID, sessionID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to check purchase status"})
		return
	}

	// Jika count > 0 berarti sudah beli (true), jika 0 belum (false)
	hasPurchased := count > 0

	c.JSON(200, gin.H{
		"session_id":    sessionID,
		"session_title": sessionTitle,
		"has_purchased": hasPurchased, // Ini data penting untuk frontend nanti
	})
}
