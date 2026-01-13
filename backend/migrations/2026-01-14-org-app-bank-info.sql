-- Add bank info columns to organization_applications table
ALTER TABLE organization_applications ADD COLUMN bank_name VARCHAR(100) DEFAULT NULL;
ALTER TABLE organization_applications ADD COLUMN bank_account VARCHAR(100) DEFAULT NULL;
ALTER TABLE organization_applications ADD COLUMN bank_account_name VARCHAR(200) DEFAULT NULL;
