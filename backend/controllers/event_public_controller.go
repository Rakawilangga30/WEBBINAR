package controllers

import (
	"net/http"

	"BACKEND/config"
	"BACKEND/models"

	"github.com/gin-gonic/gin"
)

// Struct khusus untuk respon list agar ringan
type PublicEventResponse struct {
	ID               int64   `db:"id" json:"id"`
	Title            string  `db:"title" json:"title"`
	Description      string  `db:"description" json:"description"` // Tambahkan deskripsi untuk preview
	Category         string  `db:"category" json:"category"`
	ThumbnailURL     *string `db:"thumbnail_url" json:"thumbnail_url"`
	OrganizationName string  `db:"organization_name" json:"organization_name"`
	SessionCount     int     `db:"session_count" json:"session_count"`
	MinPrice         float64 `db:"min_price" json:"min_price"`
	PublishAt        *string `db:"publish_at" json:"publish_at"`
}

// =========================================================
// GET ALL PUBLIC EVENTS (Published & Scheduled separated)
// =========================================================
func ListPublicEvents(c *gin.Context) {

	category := c.Query("category") // Filter opsional

	// Base Query: Join Event dengan Organization & Hitung Sesi/Harga
	baseQuery := `
		SELECT 
			e.id,
			e.title,
			e.description,
			e.category,
			e.thumbnail_url,
			o.name AS organization_name,
			(SELECT COUNT(*) FROM sessions s WHERE s.event_id = e.id) AS session_count,
			(SELECT COALESCE(MIN(price), 0) FROM sessions s WHERE s.event_id = e.id) AS min_price,
			e.publish_at
		FROM events e
		JOIN organizations o ON o.id = e.organization_id
	`

	// 1. Ambil Event PUBLISHED (Sedang Tayang)
	// ----------------------------------------
	queryPub := baseQuery + " WHERE e.publish_status = 'PUBLISHED'"
	paramsPub := []interface{}{}

	if category != "" {
		queryPub += " AND e.category = ?"
		paramsPub = append(paramsPub, category)
	}
	queryPub += " ORDER BY e.created_at DESC"

	var publishedEvents []PublicEventResponse
	err := config.DB.Select(&publishedEvents, queryPub, paramsPub...)
	if err != nil {
		publishedEvents = []PublicEventResponse{} // Return array kosong jika error/tidak ada data
	}

	// 2. Ambil Event SCHEDULED (Coming Soon / Upcoming)
	// -------------------------------------------------
	queryUp := baseQuery + " WHERE e.publish_status = 'SCHEDULED'"
	paramsUp := []interface{}{}

	if category != "" {
		queryUp += " AND e.category = ?"
		paramsUp = append(paramsUp, category)
	}
	// Urutkan berdasarkan tanggal tayang (yang paling dekat tayang duluan)
	queryUp += " ORDER BY e.publish_at ASC"

	var upcomingEvents []PublicEventResponse
	err = config.DB.Select(&upcomingEvents, queryUp, paramsUp...)
	if err != nil {
		upcomingEvents = []PublicEventResponse{}
	}

	// Kirim kedua list ke Frontend
	c.JSON(http.StatusOK, gin.H{
		"events":   publishedEvents,
		"upcoming": upcomingEvents,
	})
}

// =========================
// GET EVENT DETAIL (PUBLIC)
// =========================
func GetEventDetail(c *gin.Context) {

	eventID := c.Param("eventID")

	// 1. Ambil Detail Event
	// Kita izinkan user melihat event 'SCHEDULED' juga sebagai preview
	var event models.Event
	err := config.DB.Get(&event, `
		SELECT * FROM events 
		WHERE id = ? AND (publish_status = 'PUBLISHED' OR publish_status = 'SCHEDULED')
	`, eventID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found or not available yet"})
		return
	}

	// 2. Ambil Daftar Sesi
	// Kita juga tampilkan sesi yang Published atau Scheduled (agar user tau silabusnya)
	var sessions []models.Session
	err = config.DB.Select(&sessions, `
		SELECT * FROM sessions
		WHERE event_id = ? AND (publish_status = 'PUBLISHED' OR publish_status = 'SCHEDULED')
		ORDER BY order_index ASC
	`, eventID)

	if err != nil {
		sessions = []models.Session{}
	}

	c.JSON(http.StatusOK, gin.H{
		"event":    event,
		"sessions": sessions,
	})
}