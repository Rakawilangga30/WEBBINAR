package config

import (
	"os"

	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
)

var SnapClient snap.Client

// InitMidtrans initializes the Midtrans Snap client
func InitMidtrans() {
	serverKey := os.Getenv("MIDTRANS_SERVER_KEY")

	// Initialize Snap client with Sandbox environment
	SnapClient.New(serverKey, midtrans.Sandbox)
}

// GetMidtransClientKey returns the client key for frontend
func GetMidtransClientKey() string {
	return os.Getenv("MIDTRANS_CLIENT_KEY")
}
