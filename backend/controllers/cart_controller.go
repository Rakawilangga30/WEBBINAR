package controllers

import (
	"fmt"
	"net/http"
	"strconv"

	"BACKEND/config"

	"github.com/gin-gonic/gin"
)

// ===============================================
// CART MANAGEMENT
// ===============================================

// GetCart - Get user's cart with items
// GET /user/cart
func GetCart(c *gin.Context) {
	userID := c.GetInt64("user_id")

	// Ensure cart exists
	var cartID int64
	err := config.DB.Get(&cartID, "SELECT id FROM carts WHERE user_id = ?", userID)
	if err != nil {
		// Create cart if not exists
		result, _ := config.DB.Exec("INSERT INTO carts (user_id) VALUES (?)", userID)
		cartID, _ = result.LastInsertId()
	}

	// Get affiliate code if applied
	var affiliateCode *string
	config.DB.Get(&affiliateCode, "SELECT affiliate_code FROM carts WHERE id = ?", cartID)

	// Get cart items with details
	var items []struct {
		ID           int64   `db:"id" json:"id"`
		ItemType     string  `db:"item_type" json:"item_type"`
		SessionID    *int64  `db:"session_id" json:"session_id"`
		EventID      *int64  `db:"event_id" json:"event_id"`
		Price        float64 `db:"price" json:"price"`
		ItemTitle    string  `db:"item_title" json:"item_title"`
		EventTitle   string  `db:"event_title" json:"event_title"`
		ThumbnailURL *string `db:"thumbnail_url" json:"thumbnail_url"`
	}

	config.DB.Select(&items, `
		SELECT ci.id, ci.item_type, ci.session_id, ci.event_id, ci.price,
			CASE 
				WHEN ci.item_type = 'SESSION' THEN s.title
				ELSE CONCAT(e.title, ' (Full Package)')
			END as item_title,
			e.title as event_title,
			e.thumbnail_url
		FROM cart_items ci
		LEFT JOIN sessions s ON ci.session_id = s.id
		LEFT JOIN events e ON COALESCE(ci.event_id, s.event_id) = e.id
		WHERE ci.cart_id = ?
		ORDER BY ci.added_at DESC
	`, cartID)

	// Calculate total
	var total float64
	for _, item := range items {
		total += item.Price
	}

	if items == nil {
		items = []struct {
			ID           int64   `db:"id" json:"id"`
			ItemType     string  `db:"item_type" json:"item_type"`
			SessionID    *int64  `db:"session_id" json:"session_id"`
			EventID      *int64  `db:"event_id" json:"event_id"`
			Price        float64 `db:"price" json:"price"`
			ItemTitle    string  `db:"item_title" json:"item_title"`
			EventTitle   string  `db:"event_title" json:"event_title"`
			ThumbnailURL *string `db:"thumbnail_url" json:"thumbnail_url"`
		}{}
	}

	c.JSON(http.StatusOK, gin.H{
		"cart_id":        cartID,
		"items":          items,
		"total_price":    total,
		"item_count":     len(items),
		"affiliate_code": affiliateCode,
	})
}

// AddToCartInput represents add to cart request
type AddToCartInput struct {
	SessionID *int64 `json:"session_id"` // For single session
	EventID   *int64 `json:"event_id"`   // For event package (all sessions)
}

// AddToCart - Add session or event package to cart
// POST /user/cart/add
func AddToCart(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var input AddToCartInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id atau event_id diperlukan"})
		return
	}

	if input.SessionID == nil && input.EventID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id atau event_id diperlukan"})
		return
	}

	// Get or create cart
	var cartID int64
	err := config.DB.Get(&cartID, "SELECT id FROM carts WHERE user_id = ?", userID)
	if err != nil {
		result, _ := config.DB.Exec("INSERT INTO carts (user_id) VALUES (?)", userID)
		cartID, _ = result.LastInsertId()
	}

	if input.SessionID != nil {
		// Add single session
		var session struct {
			ID            int64   `db:"id"`
			Price         float64 `db:"price"`
			EventID       int64   `db:"event_id"`
			PublishStatus string  `db:"publish_status"`
		}
		err := config.DB.Get(&session, "SELECT id, price, event_id, publish_status FROM sessions WHERE id = ?", *input.SessionID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sesi tidak ditemukan"})
			return
		}
		if session.PublishStatus != "PUBLISHED" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Sesi belum dipublish"})
			return
		}

		// Check if already purchased
		var purchased int
		config.DB.Get(&purchased, "SELECT COUNT(*) FROM purchases WHERE user_id = ? AND session_id = ? AND status = 'PAID'", userID, *input.SessionID)
		if purchased > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah membeli sesi ini"})
			return
		}

		// Check if already in cart
		var inCart int
		config.DB.Get(&inCart, "SELECT COUNT(*) FROM cart_items WHERE cart_id = ? AND session_id = ?", cartID, *input.SessionID)
		if inCart > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Sesi sudah ada di keranjang"})
			return
		}

		// Add to cart
		_, err = config.DB.Exec(`
			INSERT INTO cart_items (cart_id, item_type, session_id, price)
			VALUES (?, 'SESSION', ?, ?)
		`, cartID, *input.SessionID, session.Price)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menambahkan ke keranjang"})
			return
		}

	} else if input.EventID != nil {
		// Add event package (all sessions)
		var event struct {
			ID           int64    `db:"id"`
			PackagePrice *float64 `db:"package_price"`
			Title        string   `db:"title"`
		}
		err := config.DB.Get(&event, "SELECT id, package_price, title FROM events WHERE id = ? AND publish_status = 'PUBLISHED'", *input.EventID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event tidak ditemukan"})
			return
		}

		if event.PackagePrice == nil || *event.PackagePrice <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Event ini tidak memiliki paket bundling"})
			return
		}

		// Check if already in cart
		var inCart int
		config.DB.Get(&inCart, "SELECT COUNT(*) FROM cart_items WHERE cart_id = ? AND event_id = ? AND item_type = 'EVENT_PACKAGE'", cartID, *input.EventID)
		if inCart > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Paket event sudah ada di keranjang"})
			return
		}

		// Add package to cart
		_, err = config.DB.Exec(`
			INSERT INTO cart_items (cart_id, item_type, event_id, price)
			VALUES (?, 'EVENT_PACKAGE', ?, ?)
		`, cartID, *input.EventID, *event.PackagePrice)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menambahkan ke keranjang"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Berhasil ditambahkan ke keranjang"})
}

// RemoveFromCart - Remove item from cart
// DELETE /user/cart/items/:id
func RemoveFromCart(c *gin.Context) {
	userID := c.GetInt64("user_id")
	itemID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	// Get cart
	var cartID int64
	err := config.DB.Get(&cartID, "SELECT id FROM carts WHERE user_id = ?", userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Keranjang tidak ditemukan"})
		return
	}

	// Delete item
	result, _ := config.DB.Exec("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", itemID, cartID)
	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item dihapus dari keranjang"})
}

// ApplyAffiliateCode - Apply promo code to cart
// POST /user/cart/apply-code
func ApplyAffiliateCode(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var input struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode promo diperlukan"})
		return
	}

	// Validate code exists, is approved, active, and not expired
	var partnership struct {
		ID                   int64   `db:"id"`
		EventID              int64   `db:"event_id"`
		CommissionPercentage float64 `db:"commission_percentage"`
		IsActive             bool    `db:"is_active"`
		IsExpired            bool    `db:"is_expired"`
	}
	err := config.DB.Get(&partnership, `
		SELECT id, event_id, commission_percentage, 
			COALESCE(is_active, 1) as is_active,
			CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 1 ELSE 0 END as is_expired
		FROM affiliate_partnerships 
		WHERE unique_code = ? AND status = 'APPROVED'
	`, input.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode promo tidak valid"})
		return
	}

	// Check if code is active
	if !partnership.IsActive {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode promo sudah tidak aktif"})
		return
	}

	// Check if code is expired
	if partnership.IsExpired {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode promo sudah kadaluarsa"})
		return
	}

	// Get or create cart
	var cartID int64
	config.DB.Get(&cartID, "SELECT id FROM carts WHERE user_id = ?", userID)
	if cartID == 0 {
		result, _ := config.DB.Exec("INSERT INTO carts (user_id) VALUES (?)", userID)
		cartID, _ = result.LastInsertId()
	}

	// Apply code to cart
	config.DB.Exec("UPDATE carts SET affiliate_code = ? WHERE id = ?", input.Code, cartID)

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Kode promo berhasil diterapkan (diskon affiliate: %.0f%%)", partnership.CommissionPercentage),
		"code":    input.Code,
	})
}

// ClearCart - Clear all items from cart
// DELETE /user/cart
func ClearCart(c *gin.Context) {
	userID := c.GetInt64("user_id")

	config.DB.Exec("DELETE ci FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE c.user_id = ?", userID)
	config.DB.Exec("UPDATE carts SET affiliate_code = NULL WHERE user_id = ?", userID)

	c.JSON(http.StatusOK, gin.H{"message": "Keranjang dikosongkan"})
}

// ClearAffiliateCode - Clear only affiliate code from cart (keep items)
// DELETE /user/cart/clear-code OR POST /user/cart/clear-code
func ClearAffiliateCode(c *gin.Context) {
	userID := c.GetInt64("user_id")

	config.DB.Exec("UPDATE carts SET affiliate_code = NULL WHERE user_id = ?", userID)

	c.JSON(http.StatusOK, gin.H{"message": "Kode affiliate dihapus"})
}
