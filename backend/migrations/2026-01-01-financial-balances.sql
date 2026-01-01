-- Financial Balances System
-- Created: 2026-01-01

-- Organization balances (for regular orgs, NOT official org)
CREATE TABLE IF NOT EXISTS organization_balances (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  organization_id BIGINT NOT NULL UNIQUE,
  balance DECIMAL(15,2) DEFAULT 0.00,
  total_earned DECIMAL(15,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(15,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Affiliate balances (auto-credited from each sale, 90%)
CREATE TABLE IF NOT EXISTS affiliate_balances (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  balance DECIMAL(15,2) DEFAULT 0.00,
  total_earned DECIMAL(15,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(15,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transaction ledger for tracking all financial movements
CREATE TABLE IF NOT EXISTS financial_transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  transaction_type ENUM('SALE', 'AFFILIATE_CREDIT', 'PLATFORM_FEE', 'WITHDRAWAL') NOT NULL,
  entity_type ENUM('ORGANIZATION', 'AFFILIATE', 'PLATFORM') NOT NULL,
  entity_id BIGINT NOT NULL, -- org_id or user_id
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  reference_id VARCHAR(100), -- order_id or withdrawal reference
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
