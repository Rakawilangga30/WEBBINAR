package models

import "time"

// AffiliateSubmission represents an event submission from an external affiliate
type AffiliateSubmission struct {
	ID                int64      `db:"id" json:"id"`
	FullName          string     `db:"full_name" json:"full_name"`
	Email             string     `db:"email" json:"email"`
	Phone             *string    `db:"phone" json:"phone"`
	EventTitle        string     `db:"event_title" json:"event_title"`
	EventDescription  *string    `db:"event_description" json:"event_description"`
	EventPrice        int64      `db:"event_price" json:"event_price"`
	PosterURL         *string    `db:"poster_url" json:"poster_url"`
	BankName          *string    `db:"bank_name" json:"bank_name"`
	BankAccountNumber *string    `db:"bank_account_number" json:"bank_account_number"`
	BankAccountHolder *string    `db:"bank_account_holder" json:"bank_account_holder"`
	Status            string     `db:"status" json:"status"`
	ReviewedBy        *int64     `db:"reviewed_by" json:"reviewed_by"`
	ReviewedAt        *time.Time `db:"reviewed_at" json:"reviewed_at"`
	ReviewNote        *string    `db:"review_note" json:"review_note"`
	CreatedAt         time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time  `db:"updated_at" json:"updated_at"`
}

// AffiliateLedger tracks revenue split for each affiliate purchase
type AffiliateLedger struct {
	ID                    int64      `db:"id" json:"id"`
	AffiliateSubmissionID int64      `db:"affiliate_submission_id" json:"affiliate_submission_id"`
	OrderID               string     `db:"order_id" json:"order_id"`
	TransactionAmount     float64    `db:"transaction_amount" json:"transaction_amount"`
	PlatformFee           float64    `db:"platform_fee" json:"platform_fee"`
	AffiliateAmount       float64    `db:"affiliate_amount" json:"affiliate_amount"`
	IsPaidOut             bool       `db:"is_paid_out" json:"is_paid_out"`
	PaidOutAt             *time.Time `db:"paid_out_at" json:"paid_out_at"`
	CreatedAt             time.Time  `db:"created_at" json:"created_at"`
}

// AffiliateSubmissionWithReviewer includes reviewer info for admin views
type AffiliateSubmissionWithReviewer struct {
	AffiliateSubmission
	ReviewerName *string `db:"reviewer_name" json:"reviewer_name"`
}

// AffiliateLedgerWithDetails includes submission info for ledger views
type AffiliateLedgerWithDetails struct {
	AffiliateLedger
	AffiliateFullName string `db:"affiliate_full_name" json:"affiliate_full_name"`
	AffiliateEmail    string `db:"affiliate_email" json:"affiliate_email"`
	EventTitle        string `db:"event_title" json:"event_title"`
}
