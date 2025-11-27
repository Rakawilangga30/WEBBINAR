package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"BACKEND/config"
	"BACKEND/models"
)


// ================================
// GET PROFILE USER SENDIRI
// ================================
func GetMe(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var user models.User
	err := config.DB.Get(&user,
		`SELECT id, name, email, phone, profile_img, bio 
		 FROM users WHERE id = ?`,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}


// ================================
// UPDATE PROFILE USER SENDIRI
// ================================
type UpdateMeRequest struct {
	Name       string `json:"name"`
	Phone      string `json:"phone"`
	ProfileImg string `json:"profile_img"`
	Bio        string `json:"bio"`
}

func UpdateMe(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var req UpdateMeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	_, err := config.DB.Exec(`
		UPDATE users 
		SET name = ?, phone = ?, profile_img = ?, bio = ?
		WHERE id = ?
	`,
		req.Name, req.Phone, req.ProfileImg, req.Bio, userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}


// ================================
// ADMIN: GET ALL USERS
// ================================
func GetAllUsers(c *gin.Context) {
	var users []models.User

	err := config.DB.Select(&users, `
		SELECT id, name, email, phone, profile_img, bio 
		FROM users ORDER BY id DESC
	`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}


// ================================
// ADMIN: GET USER BY ID
// ================================
func GetUserByID(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	err := config.DB.Get(&user,
		`SELECT id, name, email, phone, profile_img, bio 
		 FROM users WHERE id = ?`,
		id,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}


// ================================
// ADMIN: UPDATE USER
// ================================
type AdminUpdateUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	Bio   string `json:"bio"`
}

func UpdateUserByAdmin(c *gin.Context) {
	id := c.Param("id")

	var req AdminUpdateUserRequest
	if c.ShouldBindJSON(&req) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	_, err := config.DB.Exec(`
		UPDATE users 
		SET name=?, email=?, phone=?, bio=?
		WHERE id=?
	`, req.Name, req.Email, req.Phone, req.Bio, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
}


// ================================
// ADMIN: DELETE USER
// ================================
func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	// Hapus relasi role
	config.DB.Exec("DELETE FROM user_roles WHERE user_id=?", id)

	_, err := config.DB.Exec("DELETE FROM users WHERE id=?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}


// ================================
// ADMIN: CREATE NEW USER
// ================================
type AdminCreateUserRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

func CreateUserByAdmin(c *gin.Context) {
	var req AdminCreateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Cek duplikasi email
	var count int
	config.DB.Get(&count, "SELECT COUNT(*) FROM users WHERE email=?", req.Email)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already in use"})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Insert user
	res, err := config.DB.Exec(`
		INSERT INTO users (name, email, password_hash)
		VALUES (?, ?, ?)
	`, req.Name, req.Email, string(hash))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	userID, _ := res.LastInsertId()

	// Role mapping
	var roleID int
	switch req.Role {
	case "ADMIN":
		roleID = 3
	case "ORGANIZATION":
		roleID = 2
	default:
		roleID = 1
	}

	// Assign role
	_, err = config.DB.Exec(`
		INSERT INTO user_roles (user_id, role_id)
		VALUES (?, ?)
	`, userID, roleID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User created successfully",
		"user_id": userID,
		"role":    req.Role,
	})
}
