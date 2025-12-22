package controllers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"BACKEND/config"
	"BACKEND/helpers"
	"BACKEND/models" // Pastikan import models ada
)

// ================================
// REGISTER
// ================================
type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// 1. Cek email sudah ada
	var count int
	if err := config.DB.Get(&count, "SELECT COUNT(*) FROM users WHERE email=?", req.Email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already in use"})
		return
	}

	// 2. Hash password
	hash, err := helpers.HashPassword(req.Password) // Menggunakan helper hash
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// 3. Insert user
	res, err := config.DB.Exec(`
		INSERT INTO users (name, email, password_hash) 
		VALUES (?, ?, ?)
	`, req.Name, req.Email, hash)

	if err != nil {
		log.Println("Insert user error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create user"})
		return
	}

	userID, _ := res.LastInsertId()

	// 4. Assign role USER (id=1) sebagai default
	if _, err := config.DB.Exec(`
		INSERT INTO user_roles (user_id, role_id) VALUES (?, 1)
	`, userID); err != nil {
		log.Println("Assign role error:", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Register success",
		"user_id": userID,
	})
}

// ================================
// LOGIN
// ================================
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	// Roles dihapus dari request karena client tidak kirim role saat login
}

func Login(c *gin.Context) {
	var req LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// 1. Ambil user berdasarkan email
	var user models.User // Menggunakan struct dari models agar lebih rapi
	if err := config.DB.Get(&user, `
		SELECT id, name, email, password_hash 
		FROM users 
		WHERE email = ?
	`, req.Email); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
		return
	}

	// 2. Cek password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
		return
	}

	// 3. AMBIL SEMUA ROLE (Fix: Menggunakan Select & []string)
	var roles []string
	err := config.DB.Select(&roles, `
		SELECT r.name 
		FROM roles r 
		JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = ?
	`, user.ID)

	if err != nil {
		roles = []string{} // Default array kosong jika tidak ada role
	}

	// 4. Generate token
	// Pastikan function GenerateToken di helpers sudah support parameter roles ([]string)
	token, err := helpers.GenerateToken(user.ID, roles)
	if err != nil {
		log.Println("Token error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// 5. Kirim Response Lengkap
	c.JSON(http.StatusOK, gin.H{
		"message": "Login success",
		"token":   token,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
		},
		"roles": roles, // Mengirim array roles ke frontend
	})
}