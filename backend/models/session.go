package models

import "time"

type SessionSummary struct {
    ID            int64      `db:"id" json:"id"`
	EventID       int64      `db:"event_id" json:"event_id"`
	Title         string     `db:"title" json:"title"`
	Description   string     `db:"description" json:"description"`
	Price         int64      `db:"price" json:"price"`
	OrderIndex    int        `db:"order_index" json:"order_index"`
	PublishStatus string     `db:"publish_status" json:"publish_status"` // <--- BARU
	PublishAt     *time.Time `db:"publish_at" json:"publish_at"`         // <--- BARU
	CreatedAt     time.Time  `db:"created_at" json:"created_at"`
}
