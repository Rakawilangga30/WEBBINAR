-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Types:
-- 'application_approved' - Pengajuan disetujui
-- 'application_rejected' - Pengajuan ditolak
-- 'role_changed' - Role berubah
-- 'account_warning' - Peringatan akun
-- 'system' - Notifikasi sistem
