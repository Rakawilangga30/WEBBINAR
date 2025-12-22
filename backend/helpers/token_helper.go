package helpers

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5" // Pastikan pakai v5, atau sesuaikan dengan go.mod kamu
)

var secretKey = []byte(os.Getenv("JWT_SECRET"))

// Struct Claim sekarang menyimpan Roles sebagai slice string
type MyCustomClaims struct {
	UserID int64    `json:"user_id"`
	Roles  []string `json:"roles"` // <--- UBAH INI (dari string ke []string)
	jwt.RegisteredClaims
}

// GenerateToken sekarang menerima roles []string
func GenerateToken(userID int64, roles []string) (string, error) {
	claims := MyCustomClaims{
		UserID: userID,
		Roles:  roles, // <--- Simpan array roles
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "proyek3-backend",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretKey)
}

// ValidateToken mengembalikan claims jika valid
func ValidateToken(tokenString string) (*MyCustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &MyCustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*MyCustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}