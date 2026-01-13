package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"BACKEND/config"

	"github.com/gin-gonic/gin"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
)

// ===============================================
// CART CHECKOUT
// ===============================================

// CheckoutCart - Create payment for all items in cart
// POST /user/cart/checkout
func CheckoutCart(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Get cart
	var cart struct {
		ID            int64   `db:"id"`
		AffiliateCode *string `db:"affiliate_code"`
	}
	err := config.DB.Get(&cart, "SELECT id, affiliate_code FROM carts WHERE user_id = ?", userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Keranjang kosong"})
		return
	}

	// Get cart items
	var items []struct {
		ID        int64   `db:"id"`
		ItemType  string  `db:"item_type"`
		SessionID *int64  `db:"session_id"`
		EventID   *int64  `db:"event_id"`
		Price     float64 `db:"price"`
	}
	config.DB.Select(&items, "SELECT id, item_type, session_id, event_id, price FROM cart_items WHERE cart_id = ?", cart.ID)

	if len(items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Keranjang kosong"})
		return
	}

	// Calculate total
	var total float64
	for _, item := range items {
		total += item.Price
	}

	if total < 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Total minimal Rp 100 untuk pembayaran"})
		return
	}

	// Get user details
	var user struct {
		Name     string `db:"name"`
		Email    string `db:"email"`
		Phone    string `db:"phone"`
		Username string `db:"username"`
	}
	config.DB.Get(&user, "SELECT name, email, COALESCE(phone, '') as phone, COALESCE(username, '') as username FROM users WHERE id = ?", userID)

	// Check profile completeness
	if user.Name == "" || user.Email == "" || user.Phone == "" || user.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":              "Lengkapi profil Anda terlebih dahulu",
			"profile_incomplete": true,
		})
		return
	}

	// Generate order ID - save base order ID for database updates
	baseOrderID := fmt.Sprintf("CART-%d-%d-%d", time.Now().Unix(), cart.ID, userID)
	orderID := baseOrderID

	// Start transaction
	tx, _ := config.DB.Beginx()
	defer tx.Rollback()

	// Create purchases for each item with affiliate code
	for _, item := range items {
		if item.ItemType == "SESSION" && item.SessionID != nil {
			// Single session purchase - include affiliate_code
			_, err := tx.Exec(`
				INSERT INTO purchases (user_id, session_id, price_paid, status, order_id, affiliate_code)
				VALUES (?, ?, ?, 'PENDING', ?, ?)
				ON DUPLICATE KEY UPDATE status = 'PENDING', order_id = ?, price_paid = ?, affiliate_code = ?
			`, userID, *item.SessionID, item.Price, baseOrderID, cart.AffiliateCode, baseOrderID, item.Price, cart.AffiliateCode)
			if err != nil {
				fmt.Printf("[CHECKOUT] Error creating purchase: %v\n", err)
			}
		} else if item.ItemType == "EVENT_PACKAGE" && item.EventID != nil {
			// Package = all sessions in event
			var sessionIDs []int64
			config.DB.Select(&sessionIDs, "SELECT id FROM sessions WHERE event_id = ? AND publish_status = 'PUBLISHED'", *item.EventID)

			pricePerSession := item.Price / float64(len(sessionIDs))
			for _, sessID := range sessionIDs {
				tx.Exec(`
					INSERT INTO purchases (user_id, session_id, price_paid, status, order_id, affiliate_code)
					VALUES (?, ?, ?, 'PENDING', ?, ?)
					ON DUPLICATE KEY UPDATE status = 'PENDING', order_id = ?, price_paid = ?, affiliate_code = ?
				`, userID, sessID, pricePerSession, baseOrderID, cart.AffiliateCode, baseOrderID, pricePerSession, cart.AffiliateCode)
			}
		}
	}

	// Store affiliate code in order for later split payment (keep for backward compat)
	if cart.AffiliateCode != nil {
		orderID = fmt.Sprintf("%s-AFF-%s", baseOrderID, *cart.AffiliateCode)
	}

	// Create Midtrans payment
	var midtransItems []midtrans.ItemDetails
	for i, item := range items {
		itemName := fmt.Sprintf("Item %d", i+1)
		if item.ItemType == "SESSION" {
			var title string
			config.DB.Get(&title, "SELECT title FROM sessions WHERE id = ?", item.SessionID)
			itemName = title
		} else {
			var title string
			config.DB.Get(&title, "SELECT title FROM events WHERE id = ?", item.EventID)
			itemName = fmt.Sprintf("%s (Package)", title)
		}
		if len(itemName) > 50 {
			itemName = itemName[:47] + "..."
		}

		midtransItems = append(midtransItems, midtrans.ItemDetails{
			ID:    strconv.Itoa(i + 1),
			Name:  itemName,
			Price: int64(item.Price),
			Qty:   1,
		})
	}

	snapReq := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: int64(total),
		},
		CustomerDetail: &midtrans.CustomerDetails{
			FName: user.Name,
			Email: user.Email,
			Phone: user.Phone,
		},
		Items: &midtransItems,
		EnabledPayments: []snap.SnapPaymentType{
			"gopay",
		},
	}

	snapResp, snapErr := config.SnapClient.CreateTransaction(snapReq)
	if snapErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment: " + snapErr.Message})
		return
	}

	// Update all purchases with snap token
	// IMPORTANT: Store BOTH order IDs - base for our DB lookup, full for Midtrans lookup
	tx.Exec("UPDATE purchases SET snap_token = ?, midtrans_order_id = ? WHERE order_id = ?", snapResp.Token, orderID, baseOrderID)

	tx.Commit()

	fmt.Printf("[CART-CHECKOUT] ✅ Created order: base=%s, midtrans=%s, items=%d\n", baseOrderID, orderID, len(items))

	c.JSON(http.StatusOK, gin.H{
		"token":             snapResp.Token,
		"redirect_url":      snapResp.RedirectURL,
		"order_id":          baseOrderID, // For DB lookup
		"midtrans_order_id": orderID,     // For Midtrans API check (includes affiliate code)
		"total":             total,
		"item_count":        len(items),
	})
}

// ===============================================
// UPDATED processSuccessfulPayment for Cart Checkout
// ===============================================

// ProcessCartPayment handles successful cart payment with split payments
// Called from HandleMidtransNotification when order starts with "CART-"
func ProcessCartPayment(orderID string, grossAmount string) error {
	fmt.Printf("[CART-PAYMENT] Processing order: %s, amount: %s\n", orderID, grossAmount)

	// Parse affiliate code from order ID if present (backward compat)
	var affiliateCodeFromURL *string
	if strings.Contains(orderID, "-AFF-") {
		parts := strings.Split(orderID, "-AFF-")
		if len(parts) == 2 {
			affiliateCodeFromURL = &parts[1]
			orderID = parts[0] // Use base order ID for DB queries
			fmt.Printf("[CART-PAYMENT] Parsed affiliate code from URL: %s\n", *affiliateCodeFromURL)
		}
	}

	tx, _ := config.DB.Beginx()
	defer tx.Rollback()

	// Update all purchases to PAID (use exact match since we store baseOrderID)
	result, err := tx.Exec("UPDATE purchases SET status = 'PAID' WHERE order_id = ?", orderID)
	if err != nil {
		return fmt.Errorf("failed to update purchases: %v", err)
	}
	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("[CART-PAYMENT] Updated %d purchases to PAID\n", rowsAffected)

	// Get all purchases in this order - now include affiliate_code from purchases table!
	var purchases []struct {
		ID            int64   `db:"id"`
		SessionID     int64   `db:"session_id"`
		PricePaid     float64 `db:"price_paid"`
		EventID       int64   `db:"event_id"`
		OrgID         int64   `db:"org_id"`
		IsOfficial    bool    `db:"is_official"`
		AffiliateCode *string `db:"affiliate_code"`
	}
	tx.Select(&purchases, `
		SELECT p.id, p.session_id, p.price_paid, e.id as event_id, 
			o.id as org_id, COALESCE(o.is_official, 0) as is_official,
			p.affiliate_code
		FROM purchases p
		JOIN sessions s ON p.session_id = s.id
		JOIN events e ON s.event_id = e.id
		JOIN organizations o ON e.organization_id = o.id
		WHERE p.order_id = ?
	`, orderID)

	fmt.Printf("[CART-PAYMENT] Found %d purchases to process\n", len(purchases))

	// Get buyer ID
	var buyerID int64
	tx.Get(&buyerID, "SELECT user_id FROM purchases WHERE order_id = ? LIMIT 1", orderID)

	// Process each purchase with split payment
	for _, purchase := range purchases {
		if purchase.IsOfficial {
			continue // Skip official org - no balance credit
		}

		// Check if affiliate code is valid for this event
		// Use affiliate_code from purchase table, fallback to URL-parsed code
		var affiliateCode *string
		if purchase.AffiliateCode != nil && *purchase.AffiliateCode != "" {
			affiliateCode = purchase.AffiliateCode
			fmt.Printf("[CART-PAYMENT] Using affiliate code from purchase: %s for event %d\n", *affiliateCode, purchase.EventID)
		} else if affiliateCodeFromURL != nil {
			affiliateCode = affiliateCodeFromURL
			fmt.Printf("[CART-PAYMENT] Using affiliate code from URL: %s for event %d\n", *affiliateCode, purchase.EventID)
		}

		var partnership struct {
			UserID               int64   `db:"user_id"`
			CommissionPercentage float64 `db:"commission_percentage"`
		}

		hasAffiliate := false
		if affiliateCode != nil {
			err := tx.Get(&partnership, `
				SELECT user_id, commission_percentage 
				FROM affiliate_partnerships 
				WHERE unique_code = ? AND event_id = ? AND status = 'APPROVED'
			`, *affiliateCode, purchase.EventID)
			if err == nil {
				hasAffiliate = true
				fmt.Printf("[CART-PAYMENT] ✅ Found affiliate partnership: user=%d, commission=%.2f%%\n", partnership.UserID, partnership.CommissionPercentage)
			} else {
				fmt.Printf("[CART-PAYMENT] ⚠️ No matching partnership for code=%s, event=%d: %v\n", *affiliateCode, purchase.EventID, err)
			}
		}

		if hasAffiliate {
			// Split payment: affiliate gets commission, org gets remainder
			commission := purchase.PricePaid * (partnership.CommissionPercentage / 100)
			orgAmount := purchase.PricePaid - commission

			fmt.Printf("[CART-PAYMENT] 💰 Splitting payment: total=%.0f, commission=%.0f (%.2f%%), org=%.0f\n",
				purchase.PricePaid, commission, partnership.CommissionPercentage, orgAmount)

			// Credit affiliate balance
			_, affErr := tx.Exec(`
				INSERT INTO affiliate_balances (user_id, balance, total_earned)
				VALUES (?, ?, ?)
				ON DUPLICATE KEY UPDATE 
					balance = balance + ?,
					total_earned = total_earned + ?
			`, partnership.UserID, commission, commission, commission, commission)

			if affErr != nil {
				fmt.Printf("[CART-PAYMENT] ❌ Error crediting affiliate balance: %v\n", affErr)
			} else {
				fmt.Printf("[CART-PAYMENT] ✅ Credited Rp %.0f to affiliate user %d\n", commission, partnership.UserID)
			}

			// Record affiliate transaction
			tx.Exec(`
				INSERT INTO financial_transactions (transaction_type, entity_type, entity_id, amount, description, reference_id)
				VALUES ('AFFILIATE_CREDIT', 'AFFILIATE', ?, ?, ?, ?)
			`, partnership.UserID, commission, fmt.Sprintf("Komisi dari session ID %d", purchase.SessionID), orderID)

			// Credit org balance (minus commission)
			tx.Exec(`
				INSERT INTO organization_balances (organization_id, balance, total_earned)
				VALUES (?, ?, ?)
				ON DUPLICATE KEY UPDATE 
					balance = balance + ?,
					total_earned = total_earned + ?
			`, purchase.OrgID, orgAmount, orgAmount, orgAmount, orgAmount)

			// Notify affiliate
			CreateNotification(
				partnership.UserID,
				"affiliate_sale",
				"🛒 Penjualan dari Kode Promo!",
				fmt.Sprintf("Anda mendapat komisi Rp %.0f dari penjualan", commission),
			)

		} else {
			// No affiliate - full amount to org
			tx.Exec(`
				INSERT INTO organization_balances (organization_id, balance, total_earned)
				VALUES (?, ?, ?)
				ON DUPLICATE KEY UPDATE 
					balance = balance + ?,
					total_earned = total_earned + ?
			`, purchase.OrgID, purchase.PricePaid, purchase.PricePaid, purchase.PricePaid, purchase.PricePaid)
		}

		// Record org transaction
		tx.Exec(`
			INSERT INTO financial_transactions (transaction_type, entity_type, entity_id, amount, description, reference_id)
			VALUES ('SALE', 'ORGANIZATION', ?, ?, ?, ?)
		`, purchase.OrgID, purchase.PricePaid, fmt.Sprintf("Penjualan session ID %d", purchase.SessionID), orderID)
	}

	// Clear cart
	tx.Exec("DELETE ci FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE c.user_id = ?", buyerID)
	tx.Exec("UPDATE carts SET affiliate_code = NULL WHERE user_id = ?", buyerID)

	// Notify buyer
	CreateNotification(
		buyerID,
		"purchase_success",
		"✅ Pembayaran Berhasil!",
		fmt.Sprintf("Pembelian %d item berhasil. Silakan akses konten Anda.", len(purchases)),
	)

	return tx.Commit()
}
