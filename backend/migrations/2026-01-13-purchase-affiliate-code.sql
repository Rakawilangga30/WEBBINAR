-- Migration: Add affiliate_code column to purchases table
-- Date: 2026-01-13
-- Purpose: Store affiliate code per purchase for better tracking

-- Add affiliate_code column (run this manually, ignore error if column exists)
ALTER TABLE purchases ADD COLUMN affiliate_code VARCHAR(50) DEFAULT NULL;

-- Create index for faster lookups (ignore error if index exists)
CREATE INDEX idx_purchases_affiliate_code ON purchases(affiliate_code);
