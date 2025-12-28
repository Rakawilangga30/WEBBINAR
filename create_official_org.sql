-- Create Official organization for affiliate events
-- Run this if Official org doesn't exist yet

-- Create Official org (use admin user_id = 3, change if your admin has different ID)
INSERT IGNORE INTO organizations (owner_user_id, name, description, category)
VALUES (3, 'Official', 'Platform official events & affiliate courses', 'Platform');

-- Verify
SELECT * FROM organizations WHERE name = 'Official';
