package models

import "time"

type Organization struct {
	ID          int64 `db:"id" json:"id"`
	OwnerUserID int64 `db:"owner_user_id" json:"owner_user_id"`

	Name        string `db:"name" json:"name"`
	Description string `db:"description" json:"description"`
	Category    string `db:"category" json:"category"`
	LogoURL     string `db:"logo_url" json:"logo_url"`

	Email   string `db:"email" json:"email"`
	Phone   string `db:"phone" json:"phone"`
	Website string `db:"website" json:"website"`

	SocialLink string `db:"social_link" json:"social_link"`
	Address    string `db:"address" json:"address"`

	IsOfficial bool      `db:"is_official" json:"is_official"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
}
