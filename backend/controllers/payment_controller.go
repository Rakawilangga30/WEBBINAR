package controllers

import (
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"BACKEND/config"

	"github.com/gin-gonic/gin"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
)

// ===============================================
// PAYMENT TOKEN GENERATION
// ===============================================

// GetPaymentTokenInput binds the payment token request
type GetPaymentTokenInput struct {
	SessionID int64 `json:"session_id" binding:"required"`
}

// GetPaymentToken creates a Midtrans Snap token for payment
// POST /api/user/payment/token
func GetPaymentToken(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var input GetPaymentTokenInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// Get session details
	var session struct {
		ID            int64  `db:"id"`
		Title         string `db:"title"`
		Price         int64  `db:"price"`
		EventID       int64  `db:"event_id"`
		PublishStatus string `db:"publish_status"`
	}

	err := config.DB.Get(&session, `
		SELECT id, title, price, event_id, publish_status 
		FROM sessions WHERE id = ?
	`, input.SessionID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	if session.PublishStatus != "PUBLISHED" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Session is not published"})
		return
	}

	// Check if already purchased
	var count int
	config.DB.Get(&count, `
		SELECT COUNT(*) FROM purchases 
		WHERE user_id = ? AND session_id = ? AND status = 'PAID'
	`, userID, input.SessionID)

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already purchased this session"})
		return
	}

	// Get user details
	var user struct {
		Name  string `db:"name"`
		Email string `db:"email"`
		Phone string `db:"phone"`
	}
	config.DB.Get(&user, "SELECT name, email, COALESCE(phone, '') as phone FROM users WHERE id = ?", userID)

	// Get event title for item name
	var eventTitle string
	config.DB.Get(&eventTitle, "SELECT title FROM events WHERE id = ?", session.EventID)

	// Generate unique order ID
	orderID := fmt.Sprintf("ORDER-%d-%d-%d", time.Now().Unix(), session.ID, userID)

	// Create PENDING purchase record
	_, err = config.DB.Exec(`
		INSERT INTO purchases (user_id, session_id, price_paid, status, order_id)
		VALUES (?, ?, ?, 'PENDING', ?)
	`, userID, input.SessionID, session.Price, orderID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create purchase record"})
		return
	}

	// Create Snap request
	snapReq := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: session.Price,
		},
		CustomerDetail: &midtrans.CustomerDetails{
			FName: user.Name,
			Email: user.Email,
			Phone: user.Phone,
		},
		Items: &[]midtrans.ItemDetails{
			{
				ID:    strconv.FormatInt(session.ID, 10),
				Name:  fmt.Sprintf("%s - %s", eventTitle, session.Title),
				Price: session.Price,
				Qty:   1,
			},
		},
	}

	// Get Snap token
	snapResp, snapErr := config.SnapClient.CreateTransaction(snapReq)
	if snapErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment token: " + snapErr.Message})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":        snapResp.Token,
		"redirect_url": snapResp.RedirectURL,
		"order_id":     orderID,
	})
}

// ===============================================
// MIDTRANS WEBHOOK HANDLER
// ===============================================

// MidtransNotification represents the webhook payload
type MidtransNotification struct {
	TransactionStatus string `json:"transaction_status"`
	OrderID           string `json:"order_id"`
	GrossAmount       string `json:"gross_amount"`
	SignatureKey      string `json:"signature_key"`
	StatusCode        string `json:"status_code"`
	PaymentType       string `json:"payment_type"`
	FraudStatus       string `json:"fraud_status"`
}

// HandleMidtransNotification handles webhook notifications from Midtrans
// POST /api/webhook/midtrans
func HandleMidtransNotification(c *gin.Context) {
	var notification MidtransNotification
	if err := c.ShouldBindJSON(&notification); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification"})
		return
	}

	// Verify signature (optional but recommended)
	serverKey := os.Getenv("MIDTRANS_SERVER_KEY")
	signatureInput := notification.OrderID + notification.StatusCode + notification.GrossAmount + serverKey
	hash := sha512.Sum512([]byte(signatureInput))
	expectedSignature := hex.EncodeToString(hash[:])

	if notification.SignatureKey != expectedSignature {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	// Process based on transaction status
	switch notification.TransactionStatus {
	case "capture", "settlement":
		// Check fraud status for card payments
		if notification.PaymentType == "credit_card" && notification.FraudStatus != "accept" {
			c.JSON(http.StatusOK, gin.H{"message": "Fraud detected, ignoring"})
			return
		}

		// Process successful payment
		err := processSuccessfulPayment(notification.OrderID, notification.GrossAmount)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

	case "pending":
		// Payment is pending, do nothing
		break

	case "deny", "cancel", "expire":
		// Payment failed
		_, err := config.DB.Exec(`
			UPDATE purchases SET status = 'FAILED' WHERE order_id = ?
		`, notification.OrderID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update purchase status"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "OK"})
}

// processSuccessfulPayment handles the logic when payment is successful
func processSuccessfulPayment(orderID string, grossAmount string) error {
	// Parse order ID to get session ID (format: ORDER-{timestamp}-{sessionID}-{userID})
	parts := strings.Split(orderID, "-")
	if len(parts) < 4 {
		return fmt.Errorf("invalid order ID format")
	}

	sessionID, err := strconv.ParseInt(parts[2], 10, 64)
	if err != nil {
		return fmt.Errorf("failed to parse session ID")
	}

	// Start transaction
	tx, err := config.DB.Beginx()
	if err != nil {
		return fmt.Errorf("failed to start transaction")
	}
	defer tx.Rollback()

	// Update purchase status to PAID
	_, err = tx.Exec(`
		UPDATE purchases SET status = 'PAID' WHERE order_id = ?
	`, orderID)
	if err != nil {
		return fmt.Errorf("failed to update purchase status")
	}

	// Check if this session belongs to an affiliate event
	var affiliateInfo struct {
		AffiliateSubmissionID *int64 `db:"affiliate_submission_id"`
		EventTitle            string `db:"event_title"`
	}

	err = tx.Get(&affiliateInfo, `
		SELECT e.affiliate_submission_id, e.title as event_title
		FROM sessions s
		JOIN events e ON s.event_id = e.id
		WHERE s.id = ?
	`, sessionID)

	if err != nil {
		return fmt.Errorf("failed to get event info")
	}

	// If this is an affiliate event, create ledger entry
	if affiliateInfo.AffiliateSubmissionID != nil {
		amount, _ := strconv.ParseFloat(grossAmount, 64)
		platformFee := amount * 0.10     // 10% platform fee
		affiliateAmount := amount * 0.90 // 90% affiliate amount

		_, err = tx.Exec(`
			INSERT INTO affiliate_ledgers 
			(affiliate_submission_id, order_id, transaction_amount, platform_fee, affiliate_amount, is_paid_out)
			VALUES (?, ?, ?, ?, ?, 0)
		`, *affiliateInfo.AffiliateSubmissionID, orderID, amount, platformFee, affiliateAmount)

		if err != nil {
			return fmt.Errorf("failed to create affiliate ledger entry")
		}

		// Notify affiliate about the sale
		var affiliateInfo2 struct {
			Email      string `db:"email"`
			EventTitle string `db:"event_title"`
		}
		config.DB.Get(&affiliateInfo2, `
			SELECT email, event_title FROM affiliate_submissions WHERE id = ?
		`, *affiliateInfo.AffiliateSubmissionID)

		var affiliateUserID int64
		config.DB.Get(&affiliateUserID, "SELECT id FROM users WHERE email = ?", affiliateInfo2.Email)

		if affiliateUserID > 0 {
			CreateNotification(
				affiliateUserID,
				"affiliate_sale",
				"🛒 Penjualan Baru!",
				fmt.Sprintf("Event \"%s\" terjual! Anda mendapat Rp %.0f", affiliateInfo2.EventTitle, affiliateAmount),
			)
		}
	}

	// Notify buyer
	var buyerID int64
	config.DB.Get(&buyerID, "SELECT user_id FROM purchases WHERE order_id = ?", orderID)

	if buyerID > 0 {
		CreateNotification(
			buyerID,
			"purchase_success",
			"✅ Pembayaran Berhasil!",
			"Pembelian Anda telah berhasil. Silakan akses konten yang telah dibeli.",
		)
	}

	// Notify organization owner
	go func() {
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

		var buyerName string
		config.DB.Get(&buyerName, "SELECT name FROM users WHERE id = ?", buyerID)

		if sessionInfo.OwnerID > 0 {
			CreateNotification(
				sessionInfo.OwnerID,
				"new_purchase",
				"💰 Pembelian Baru!",
				buyerName+" membeli sesi \""+sessionInfo.SessionTitle+"\" dari event \""+sessionInfo.EventTitle+"\"",
			)
		}
	}()

	return tx.Commit()
}

// ===============================================
// HELPER ENDPOINT
// ===============================================

// GetMidtransConfig returns Midtrans client key for frontend
// GET /api/config/midtrans
func GetMidtransConfig(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"client_key": config.GetMidtransClientKey(),
		"is_sandbox": true,
	})
}
