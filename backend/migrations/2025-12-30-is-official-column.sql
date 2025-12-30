-- Add is_official column to organizations table
-- This allows the Official organization name to be changed while still being identifiable

ALTER TABLE organizations ADD COLUMN is_official TINYINT(1) DEFAULT 0;

-- Mark the existing Official organization (update the ID if different)
UPDATE organizations SET is_official = 1 WHERE id = 8;
