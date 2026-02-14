package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
	"BACKEND/routes"
)

func startAutoPublishJob() {
	go func() {
		ticker := time.NewTicker(1 * time.Minute) // cek tiap 1 menit
		defer ticker.Stop()

		for range ticker.C {
			// Update semua event yang statusnya SCHEDULED
			// dan waktu publish_at sudah lewat / sama dengan sekarang
			res, err := config.DB.Exec(`
				UPDATE events
				SET publish_status = 'PUBLISHED'
				WHERE publish_status = 'SCHEDULED'
				  AND publish_at IS NOT NULL
				  AND publish_at <= NOW()
			`)

			// Tambahkan update untuk sessions juga (sesuai request Anda sebelumnya)
			res2, err2 := config.DB.Exec(`
					UPDATE sessions
					SET publish_status = 'PUBLISHED'
					WHERE publish_status = 'SCHEDULED'
					AND publish_at <= NOW()
				`)
			if err2 == nil {
				affected2, _ := res2.RowsAffected()
				if affected2 > 0 {
					log.Printf("✅ Auto publish session: %d session(s)\n", affected2)
				}
			}

			if err != nil {
				log.Println("❌ Auto publish job error:", err)
				continue
			}

			affected, _ := res.RowsAffected()
			if affected > 0 {
				log.Printf("✅ Auto publish: %d event(s) changed to PUBLISHED\n", affected)
			}
		}
	}()
}

func main() {
	r := gin.Default()

	config.ConnectDB()
	config.SetupCORS(r)
	config.InitMidtrans() // Initialize Midtrans

	// Jalankan cron auto publish
	startAutoPublishJob()

	// --- PENTING: Serve Static Files (Untuk Thumbnail) ---
	// Ini agar URL seperti http://localhost:8080/uploads/events/xxx.jpg bisa dibuka
	r.Static("/uploads", "./uploads")

	// Register semua route
	routes.RegisterRoutes(r)

	// Middleware untuk blok akses langsung ke folder static (Opsional, tapi hati-hati bentrok dengan r.Static)
	// Jika r.Static di atas sudah ada, middleware ini mungkin perlu disesuaikan agar tidak memblokir /uploads/events/
	// Untuk keamanan materi berbayar (video/pdf), tetap gunakan logika stream controller.
	// r.Use(middlewares.BlockStaticAccess())

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
