-- =============================================
-- User Profile Fields Migration
-- =============================================

-- STEP 1: Hapus kolom LAMA yang tidak dipakai (jika ada)
-- Jalankan ini HANYA jika sebelumnya sudah pernah menambahkan kolom-kolom ini
ALTER TABLE users DROP COLUMN IF EXISTS city;
ALTER TABLE users DROP COLUMN IF EXISTS province;
ALTER TABLE users DROP COLUMN IF EXISTS postal_code;
ALTER TABLE users DROP COLUMN IF EXISTS id_number;

-- STEP 2: Tambahkan kolom BARU yang dibutuhkan (jika belum ada)
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL;

-- =============================================
-- Catatan:
-- - gender: "Laki-laki" atau "Perempuan"
-- - birthdate: format DATE (YYYY-MM-DD)
-- - address: alamat lengkap dalam satu field
-- =============================================
