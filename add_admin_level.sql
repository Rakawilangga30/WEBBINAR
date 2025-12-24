-- Add admin_level column to users table
-- 0 = Not admin
-- 1 = Super Admin (cannot be demoted, can manage other admins)
-- 2 = Regular Admin

ALTER TABLE users ADD COLUMN admin_level INT DEFAULT 0;

-- Set existing admin(s) as Super Admin
UPDATE users SET admin_level = 1 
WHERE id IN (
    SELECT user_id FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE r.name = 'ADMIN'
);
