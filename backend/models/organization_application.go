package models

import "time"

type OrganizationApplication struct {
	ID     int64 `db:"id" json:"id"`
	UserID int64 `db:"user_id" json:"user_id"`

	OrgName        string `db:"org_name" json:"org_name"`
	OrgDescription string `db:"org_description" json:"org_description"`
	OrgCategory    string `db:"org_category" json:"org_category"`
	OrgLogoURL     string `db:"org_logo_url" json:"org_logo_url"`

	OrgEmail   string `db:"org_email" json:"org_email"`
	OrgPhone   string `db:"org_phone" json:"org_phone"`
	OrgWebsite string `db:"org_website" json:"org_website"`

	Reason      string `db:"reason" json:"reason"`
	SocialMedia string `db:"social_media" json:"social_media"`

	// Bank info for withdrawal
	BankName        string `db:"bank_name" json:"bank_name"`
	BankAccount     string `db:"bank_account" json:"bank_account"`
	BankAccountName string `db:"bank_account_name" json:"bank_account_name"`

	Status     string     `db:"status" json:"status"`
	ReviewedBy *int64     `db:"reviewed_by" json:"reviewed_by,omitempty"`
	ReviewedAt *time.Time `db:"reviewed_at" json:"reviewed_at,omitempty"`
	ReviewNote string     `db:"review_note" json:"review_note"`

	SubmittedAt time.Time `db:"submitted_at" json:"submitted_at"`
}
