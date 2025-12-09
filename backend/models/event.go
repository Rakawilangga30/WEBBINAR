package models

import "time"

type Event struct {
    ID             int64      `db:"id" json:"id"`
    OrganizationID int64      `db:"organization_id" json:"organization_id"`
    Title          string     `db:"title" json:"title"`
    Description    string     `db:"description" json:"description"`
    Category       string     `db:"category" json:"category"`
    ThumbnailURL   *string    `db:"thumbnail_url" json:"thumbnail_url"`
    PublishStatus  string     `db:"publish_status" json:"publish_status"`
    
    // --- PERBAIKAN DI SINI (Wajib time.Time) ---
    PublishAt      *time.Time `db:"publish_at" json:"publish_at"` 
    CreatedAt      time.Time  `db:"created_at" json:"created_at"`
    UpdatedAt      time.Time  `db:"updated_at" json:"updated_at"`
}

type Session struct {
	ID          int64     `db:"id" json:"id"`
	EventID     int64     `db:"event_id" json:"event_id"`
	Title       string    `db:"title" json:"title"`
	Description string    `db:"description" json:"description"`
	Price       int64     `db:"price" json:"price"`
	OrderIndex  int       `db:"order_index" json:"order_index"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
}

type SessionVideo struct {
	ID         int64     `db:"id" json:"id"`
	SessionID  int64     `db:"session_id" json:"session_id"`
	Title      string    `db:"title" json:"title"`
	VideoURL   string    `db:"video_url" json:"video_url"`
	SizeBytes  int64     `db:"size_bytes" json:"size_bytes"`
	OrderIndex int       `db:"order_index" json:"order_index"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
}

type SessionFile struct {
	ID         int64     `db:"id" json:"id"`
	SessionID  int64     `db:"session_id" json:"session_id"`
	Title      string    `db:"title" json:"title"`
	FileURL    string    `db:"file_url" json:"file_url"`
	SizeBytes  int64     `db:"size_bytes" json:"size_bytes"`
	OrderIndex int       `db:"order_index" json:"order_index"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
}