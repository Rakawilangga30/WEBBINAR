package config

import (
	"fmt"
	"log"
	"os"
	"strings"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
)

var DB *sqlx.DB

func ConnectDB() {
	godotenv.Load()

	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	host := os.Getenv("DB_HOST")
	name := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?parseTime=true", user, pass, host, name)

	var err error
	DB, err = sqlx.Connect("mysql", dsn)
	if err != nil {
		log.Fatal("❌ Database connection failed:", err)
	}

	fmt.Println("✅ Database connected!")

	// Run inline migrations
	runMigrations()
}

// runMigrations runs any pending schema changes
func runMigrations() {
	// Add midtrans_order_id column to purchases if not exists
	_, err := DB.Exec(`ALTER TABLE purchases ADD COLUMN midtrans_order_id VARCHAR(255)`)
	if err != nil {
		// Column probably already exists, that's OK
		if !strings.Contains(err.Error(), "Duplicate column") {
			fmt.Printf("Migration note: %v\n", err)
		}
	} else {
		fmt.Println("✅ Added midtrans_order_id column to purchases")
	}
}