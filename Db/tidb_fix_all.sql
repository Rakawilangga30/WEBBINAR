-- ============================================
-- TiDB Cloud: FIX ALL TABLES AUTO_INCREMENT
-- ============================================
-- PENTING: Jalankan SETIAP BLOK secara TERPISAH (satu per satu)
-- Copy satu blok -> Paste -> Run -> Lanjut blok berikutnya
-- ============================================

-- ============ BLOK 1: PERSIAPAN ============
USE webbinar;
SET FOREIGN_KEY_CHECKS = 0;

-- ============ BLOK 2: DROP SEMUA TABEL (kecuali users, user_roles, roles) ============
DROP TABLE IF EXISTS withdrawal_requests;
DROP TABLE IF EXISTS user_certificates;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS session_quizzes;
DROP TABLE IF EXISTS session_videos;
DROP TABLE IF EXISTS session_files;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS featured_events;
DROP TABLE IF EXISTS event_certificates;
DROP TABLE IF EXISTS financial_transactions;
DROP TABLE IF EXISTS affiliate_partnerships;
DROP TABLE IF EXISTS affiliate_balances;
DROP TABLE IF EXISTS affiliate_applications;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS ad_banners;
DROP TABLE IF EXISTS organization_balances;
DROP TABLE IF EXISTS organization_applications;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS organizations;

-- ============ BLOK 3: CREATE organizations ============
CREATE TABLE organizations (
  id bigint NOT NULL AUTO_INCREMENT,
  owner_user_id bigint NOT NULL,
  name varchar(150) DEFAULT NULL,
  description text,
  category varchar(100) DEFAULT NULL,
  logo_url varchar(255) DEFAULT NULL,
  email varchar(150) DEFAULT NULL,
  phone varchar(50) DEFAULT NULL,
  website varchar(255) DEFAULT NULL,
  social_link varchar(255) DEFAULT NULL,
  address varchar(255) DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  is_official tinyint(1) DEFAULT 0,
  PRIMARY KEY (id)
);

-- ============ BLOK 4: CREATE organization_applications ============
CREATE TABLE organization_applications (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  org_name varchar(150) NOT NULL,
  org_description text,
  org_category varchar(100) DEFAULT NULL,
  org_logo_url varchar(255) DEFAULT NULL,
  org_email varchar(150) DEFAULT NULL,
  org_phone varchar(50) DEFAULT NULL,
  org_website varchar(255) DEFAULT NULL,
  reason text,
  social_media text,
  status enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  reviewed_by bigint DEFAULT NULL,
  reviewed_at timestamp NULL DEFAULT NULL,
  review_note text,
  submitted_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  bank_name varchar(100) DEFAULT NULL,
  bank_account varchar(100) DEFAULT NULL,
  bank_account_name varchar(200) DEFAULT NULL,
  PRIMARY KEY (id)
);

-- ============ BLOK 5: CREATE organization_balances ============
CREATE TABLE organization_balances (
  id bigint NOT NULL AUTO_INCREMENT,
  organization_id bigint NOT NULL,
  balance decimal(15,2) DEFAULT 0.00,
  total_earned decimal(15,2) DEFAULT 0.00,
  total_withdrawn decimal(15,2) DEFAULT 0.00,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY organization_id (organization_id)
);

-- ============ BLOK 6: CREATE events ============
CREATE TABLE events (
  id bigint NOT NULL AUTO_INCREMENT,
  organization_id bigint NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  category varchar(100) DEFAULT NULL,
  thumbnail_url varchar(255) DEFAULT NULL,
  is_published tinyint(1) DEFAULT 0,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  publish_status enum('DRAFT','PUBLISHED','SCHEDULED') DEFAULT 'DRAFT',
  publish_at datetime DEFAULT NULL,
  affiliate_submission_id bigint DEFAULT NULL,
  package_price decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (id)
);

-- ============ BLOK 7: CREATE event_certificates ============
CREATE TABLE event_certificates (
  id bigint NOT NULL AUTO_INCREMENT,
  event_id bigint NOT NULL,
  is_enabled tinyint(1) DEFAULT 0,
  min_score_percent int DEFAULT 80,
  certificate_title varchar(255) DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY event_id (event_id)
);

-- ============ BLOK 8: CREATE sessions ============
CREATE TABLE sessions (
  id bigint NOT NULL AUTO_INCREMENT,
  event_id bigint NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  price int DEFAULT 0,
  order_index int DEFAULT 0,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  publish_status enum('DRAFT','PUBLISHED','SCHEDULED') DEFAULT 'DRAFT',
  publish_at datetime DEFAULT NULL,
  PRIMARY KEY (id)
);

-- ============ BLOK 9: CREATE session_videos ============
CREATE TABLE session_videos (
  id bigint NOT NULL AUTO_INCREMENT,
  session_id bigint NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  video_url varchar(255) NOT NULL,
  size_bytes bigint DEFAULT 0,
  order_index int DEFAULT 0,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ============ BLOK 10: CREATE session_files ============
CREATE TABLE session_files (
  id bigint NOT NULL AUTO_INCREMENT,
  session_id bigint NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  file_url varchar(255) NOT NULL,
  size_bytes bigint DEFAULT 0,
  order_index int DEFAULT 0,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ============ BLOK 11: CREATE session_quizzes ============
CREATE TABLE session_quizzes (
  id bigint NOT NULL AUTO_INCREMENT,
  session_id bigint NOT NULL,
  title varchar(255) DEFAULT NULL,
  is_enabled tinyint(1) DEFAULT 1,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY session_id (session_id)
);

-- ============ BLOK 12: CREATE quiz_questions ============
CREATE TABLE quiz_questions (
  id bigint NOT NULL AUTO_INCREMENT,
  quiz_id bigint NOT NULL,
  question_text text NOT NULL,
  option_a varchar(500) NOT NULL,
  option_b varchar(500) NOT NULL,
  option_c varchar(500) DEFAULT NULL,
  option_d varchar(500) DEFAULT NULL,
  correct_option char(1) NOT NULL,
  order_index int DEFAULT 0,
  PRIMARY KEY (id)
);

-- ============ BLOK 13: CREATE quiz_attempts ============
CREATE TABLE quiz_attempts (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  quiz_id bigint NOT NULL,
  score_percent decimal(5,2) NOT NULL,
  answers json DEFAULT NULL,
  passed tinyint(1) DEFAULT 0,
  attempted_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ============ BLOK 14: CREATE purchases ============
CREATE TABLE purchases (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  session_id bigint NOT NULL,
  price_paid double NOT NULL,
  purchased_at datetime DEFAULT CURRENT_TIMESTAMP,
  status enum('PENDING','PAID','FAILED') DEFAULT 'PAID',
  order_id varchar(100) DEFAULT NULL,
  snap_token varchar(255) DEFAULT NULL,
  midtrans_order_id varchar(255) DEFAULT NULL,
  affiliate_code varchar(50) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY user_id (user_id, session_id)
);

-- ============ BLOK 15: CREATE carts ============
CREATE TABLE carts (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  affiliate_code varchar(50) DEFAULT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cart_user (user_id)
);

-- ============ BLOK 16: CREATE cart_items ============
CREATE TABLE cart_items (
  id bigint NOT NULL AUTO_INCREMENT,
  cart_id bigint NOT NULL,
  item_type enum('SESSION','EVENT_PACKAGE') NOT NULL DEFAULT 'SESSION',
  session_id bigint DEFAULT NULL,
  event_id bigint DEFAULT NULL,
  price decimal(15,2) NOT NULL,
  added_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ============ BLOK 17: CREATE featured_events ============
CREATE TABLE featured_events (
  id bigint NOT NULL AUTO_INCREMENT,
  event_id bigint NOT NULL,
  order_index int DEFAULT 0,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  created_by bigint DEFAULT NULL,
  PRIMARY KEY (id)
);

-- ============ BLOK 18: CREATE ad_banners ============
CREATE TABLE ad_banners (
  id bigint NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  image_url varchar(500) NOT NULL,
  target_url varchar(500) DEFAULT NULL,
  placement enum('BANNER_SLIDER','SIDEBAR_LEFT','SIDEBAR_RIGHT') DEFAULT 'SIDEBAR_RIGHT',
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  is_active tinyint(1) DEFAULT 1,
  order_index int DEFAULT 0,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  created_by bigint DEFAULT NULL,
  PRIMARY KEY (id)
);

-- ============ BLOK 19: CREATE affiliate tables ============
CREATE TABLE affiliate_applications (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  motivation text,
  status enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  reviewed_by bigint DEFAULT NULL,
  reviewed_at datetime DEFAULT NULL,
  review_note text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_affiliate_applications_user (user_id)
);

-- ============ BLOK 20: CREATE affiliate_balances ============
CREATE TABLE affiliate_balances (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  balance decimal(15,2) DEFAULT 0.00,
  total_earned decimal(15,2) DEFAULT 0.00,
  total_withdrawn decimal(15,2) DEFAULT 0.00,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY user_id (user_id)
);

-- ============ BLOK 21: CREATE affiliate_partnerships ============
CREATE TABLE affiliate_partnerships (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  event_id bigint NOT NULL,
  organization_id bigint NOT NULL,
  unique_code varchar(50) NOT NULL,
  commission_percentage decimal(5,2) NOT NULL DEFAULT 10.00,
  status enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  approved_at datetime DEFAULT NULL,
  expires_at datetime DEFAULT NULL,
  is_active tinyint(1) DEFAULT 1,
  approved_by bigint DEFAULT NULL,
  phone varchar(20) DEFAULT NULL,
  bank_name varchar(50) DEFAULT NULL,
  bank_account varchar(50) DEFAULT NULL,
  bank_account_name varchar(100) DEFAULT NULL,
  social_media varchar(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_affiliate_event (user_id, event_id),
  UNIQUE KEY uk_unique_code (unique_code)
);

-- ============ BLOK 22: CREATE financial_transactions ============
CREATE TABLE financial_transactions (
  id bigint NOT NULL AUTO_INCREMENT,
  transaction_type enum('SALE','AFFILIATE_CREDIT','PLATFORM_FEE','WITHDRAWAL') NOT NULL,
  entity_type enum('ORGANIZATION','AFFILIATE','PLATFORM') NOT NULL,
  entity_id bigint NOT NULL,
  amount decimal(15,2) NOT NULL,
  description text,
  reference_id varchar(100) DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ============ BLOK 23: CREATE notifications ============
CREATE TABLE notifications (
  id int NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  type varchar(50) DEFAULT NULL,
  title varchar(255) DEFAULT NULL,
  message text,
  is_read tinyint(1) DEFAULT 0,
  created_at datetime DEFAULT NULL,
  PRIMARY KEY (id)
);

-- ============ BLOK 24: CREATE password_reset_tokens ============
CREATE TABLE password_reset_tokens (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  token varchar(64) NOT NULL,
  expires_at datetime NOT NULL,
  used tinyint(1) DEFAULT 0,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY token (token)
);

-- ============ BLOK 25: CREATE reports ============
CREATE TABLE reports (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint DEFAULT NULL,
  category varchar(100) DEFAULT 'general',
  subject varchar(255) NOT NULL,
  description text NOT NULL,
  photo_url varchar(500) DEFAULT NULL,
  status enum('pending','in_progress','resolved','rejected') DEFAULT 'pending',
  admin_notes text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ============ BLOK 26: CREATE user_certificates ============
CREATE TABLE user_certificates (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  event_id bigint NOT NULL,
  total_score_percent decimal(5,2) NOT NULL,
  certificate_code varchar(50) DEFAULT NULL,
  issued_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_cert (user_id, event_id),
  UNIQUE KEY certificate_code (certificate_code)
);

-- ============ BLOK 27: CREATE withdrawal_requests ============
CREATE TABLE withdrawal_requests (
  id bigint NOT NULL AUTO_INCREMENT,
  requester_type enum('ORGANIZATION','AFFILIATE') NOT NULL,
  requester_id bigint NOT NULL,
  amount decimal(15,2) NOT NULL,
  bank_name varchar(50) NOT NULL,
  bank_account varchar(50) NOT NULL,
  bank_account_name varchar(100) NOT NULL,
  notes text,
  status enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  admin_notes text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  processed_at datetime DEFAULT NULL,
  processed_by bigint DEFAULT NULL,
  PRIMARY KEY (id)
);

-- ============ BLOK 28: SELESAI ============
SET FOREIGN_KEY_CHECKS = 1;

-- ============ BLOK 29: VERIFIKASI ============
-- Jalankan ini untuk memastikan semua tabel punya AUTO_INCREMENT
SELECT TABLE_NAME, AUTO_INCREMENT 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'webbinar' 
ORDER BY TABLE_NAME;
