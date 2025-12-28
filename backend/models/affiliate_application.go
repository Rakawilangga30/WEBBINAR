package models

import "time"

// AffiliateApplication represents a user's application to become an affiliate
type AffiliateApplication struct {
	ID         int64      `db:"id" json:"id"`
	UserID     int64      `db:"user_id" json:"user_id"`
	Motivation *string    `db:"motivation" json:"motivation"`
	Status     string     `db:"status" json:"status"`
	ReviewedBy *int64     `db:"reviewed_by" json:"reviewed_by"`
	ReviewedAt *time.Time `db:"reviewed_at" json:"reviewed_at"`
	ReviewNote *string    `db:"review_note" json:"review_note"`
	CreatedAt  time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time  `db:"updated_at" json:"updated_at"`
}

// AffiliateApplicationWithUser includes user details
type AffiliateApplicationWithUser struct {
	AffiliateApplication
	UserName     string  `db:"user_name" json:"user_name"`
	UserEmail    string  `db:"user_email" json:"user_email"`
	ReviewerName *string `db:"reviewer_name" json:"reviewer_name"`
}
