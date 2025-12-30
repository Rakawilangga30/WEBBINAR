-- Migration: Add event_category column to affiliate_submissions
-- Date: 2025-12-30
-- Purpose: Store affiliate's selected category and use it when creating event

ALTER TABLE affiliate_submissions ADD COLUMN event_category VARCHAR(100) DEFAULT 'Teknologi' AFTER event_price;
