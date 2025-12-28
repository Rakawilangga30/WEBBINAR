-- =====================================================
-- AFFILIATE ROLE SYSTEM MIGRATION
-- Run this SQL in your MySQL database
-- =====================================================

-- --------------------------------------------------------
-- 1. Add AFFILIATE role
-- --------------------------------------------------------
INSERT IGNORE INTO roles (id, name) VALUES (4, 'AFFILIATE');

-- --------------------------------------------------------
-- 2. Create affiliate_applications table
-- For users applying to become affiliates
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `affiliate_applications` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `motivation` TEXT,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  `reviewed_by` BIGINT DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `review_note` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_affiliate_applications_user` (`user_id`),
  CONSTRAINT `fk_affiliate_applications_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- 3. Update affiliate_submissions table
-- Add columns for materials upload
-- --------------------------------------------------------
-- Add video_url if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'affiliate_submissions' AND COLUMN_NAME = 'video_url') = 0,
  'ALTER TABLE affiliate_submissions ADD COLUMN video_url TEXT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add video_title if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'affiliate_submissions' AND COLUMN_NAME = 'video_title') = 0,
  'ALTER TABLE affiliate_submissions ADD COLUMN video_title VARCHAR(255) DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add file_url if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'affiliate_submissions' AND COLUMN_NAME = 'file_url') = 0,
  'ALTER TABLE affiliate_submissions ADD COLUMN file_url TEXT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add file_title if not exists
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'affiliate_submissions' AND COLUMN_NAME = 'file_title') = 0,
  'ALTER TABLE affiliate_submissions ADD COLUMN file_title VARCHAR(255) DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add user_id if not exists (link to affiliate user)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'affiliate_submissions' AND COLUMN_NAME = 'user_id') = 0,
  'ALTER TABLE affiliate_submissions ADD COLUMN user_id BIGINT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------
-- 4. Create Official organization (if not exists)
-- This org hosts all affiliate events
-- --------------------------------------------------------
-- First check if "Official" org exists, if not create it
-- Owner is admin user (you may need to change user_id based on your admin)
INSERT INTO organizations (owner_user_id, name, description, category, is_verified)
SELECT 3, 'Official', 'Platform official events & affiliate courses', 'Platform', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Official');

-- --------------------------------------------------------
-- Done!
-- --------------------------------------------------------
SELECT 'Migration completed successfully!' AS result;
