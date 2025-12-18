package controllers

import (
	"BACKEND/config"
)

// Helper: Cek apakah event milik organisasi (user ini)
// Fungsi ini bisa dibiarkan di sini jika nanti dibutuhkan oleh controller sesi lain,
// atau dihapus jika tidak dipakai. Untuk amannya, biarkan saja.
func checkEventOwnedByUser(eventID, userID int64) bool {
	var count int
	err := config.DB.Get(&count, `
		SELECT COUNT(*) FROM events e
		JOIN organizations o ON e.organization_id = o.id
		WHERE e.id = ? AND o.owner_user_id = ?
	`, eventID, userID)

	if err != nil || count == 0 {
		return false
	}
	return true
}

