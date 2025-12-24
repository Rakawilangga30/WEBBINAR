package controllers

import (
	"fmt"
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
	// Read user_id from context robustly (support int/int64/float64)
	var userID int64
	if v, ok := c.Get("user_id"); ok {
		switch t := v.(type) {
		case int64:
			userID = t
		case int:
			userID = int64(t)
		case float64:
			userID = int64(t)
		default:
			userID = 0
		}
	}

	var user models.User
	var err error
	var success bool = false

	// Try 1: Query with all columns (bio and username)
	err = config.DB.Get(&user,
		`SELECT id, name, email, COALESCE(phone, '') as phone, 
		        COALESCE(profile_img, '') as profile_img, 
		        COALESCE(bio, '') as bio, 
		        COALESCE(username, '') as username
		 FROM users WHERE id = ?`,
		userID,
	)
	if err == nil {
		success = true
	}

	// Try 2: WITHOUT bio, WITH username (in case bio column doesn't exist)
	if !success {
		err = config.DB.Get(&user,
			`SELECT id, name, email, COALESCE(phone, '') as phone, 
			        COALESCE(profile_img, '') as profile_img, 
			        COALESCE(username, '') as username
			 FROM users WHERE id = ?`,
			userID,
		)
		if err == nil {
			success = true
			user.Bio = ""
		}
	}

	// Try 3: WITH bio, WITHOUT username (in case username column doesn't exist)
	if !success {
		err = config.DB.Get(&user,
			`SELECT id, name, email, COALESCE(phone, '') as phone, 
			        COALESCE(profile_img, '') as profile_img, 
			        COALESCE(bio, '') as bio
			 FROM users WHERE id = ?`,
			userID,
		)
		if err == nil {
			success = true
			user.Username = ""
		}
	}

	// Try 4: WITHOUT bio AND username
	if !success {
		err = config.DB.Get(&user,
			`SELECT id, name, email, COALESCE(phone, '') as phone, 
			        COALESCE(profile_img, '') as profile_img
			 FROM users WHERE id = ?`,
			userID,
		)
		if err == nil {
			success = true
			user.Bio = ""
			user.Username = ""
		}
	}

	// Try 5: Minimal query - just basic info
	if !success {
		err = config.DB.Get(&user,
			`SELECT id, name, email FROM users WHERE id = ?`,
			userID,
		)
		if err == nil {
			success = true
			user.Phone = ""
			user.ProfileImg = ""
			user.Bio = ""
			user.Username = ""
		}
	}

	if !success {
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
	Username   string `json:"username"`
}

func UpdateMe(c *gin.Context) {
	// Read user_id from context robustly (support int/int64/float64)
	var userID int64
	if v, ok := c.Get("user_id"); ok {
		switch t := v.(type) {
		case int64:
			userID = t
		case int:
			userID = int64(t)
		case float64:
			userID = int64(t)
		default:
			userID = 0
		}
	}

	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req UpdateMeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// Log the update request
	println("UpdateMe called for user:", userID)
	println("Request data - Name:", req.Name, "Phone:", req.Phone, "Username:", req.Username)

	var err error
	var success bool = false

	// Try 1: Update with all fields (bio and username)
	_, err = config.DB.Exec(`
		UPDATE users 
		SET name = ?, phone = ?, profile_img = ?, bio = ?, username = ?
		WHERE id = ?
	`, req.Name, req.Phone, req.ProfileImg, req.Bio, req.Username, userID)

	if err == nil {
		success = true
		println("Update succeeded with all fields")
	} else {
		println("Try 1 failed (bio+username):", err.Error())
	}

	// Try 2: WITHOUT bio, WITH username (in case bio column doesn't exist)
	if !success {
		_, err = config.DB.Exec(`
			UPDATE users 
			SET name = ?, phone = ?, profile_img = ?, username = ?
			WHERE id = ?
		`, req.Name, req.Phone, req.ProfileImg, req.Username, userID)

		if err == nil {
			success = true
			println("Update succeeded without bio, with username")
		} else {
			println("Try 2 failed (no bio, with username):", err.Error())
		}
	}

	// Try 3: WITH bio, WITHOUT username (in case username column doesn't exist)
	if !success {
		_, err = config.DB.Exec(`
			UPDATE users 
			SET name = ?, phone = ?, profile_img = ?, bio = ?
			WHERE id = ?
		`, req.Name, req.Phone, req.ProfileImg, req.Bio, userID)

		if err == nil {
			success = true
			println("Update succeeded with bio, without username")
		} else {
			println("Try 3 failed (with bio, no username):", err.Error())
		}
	}

	// Try 4: WITHOUT bio AND username
	if !success {
		_, err = config.DB.Exec(`
			UPDATE users 
			SET name = ?, phone = ?, profile_img = ?
			WHERE id = ?
		`, req.Name, req.Phone, req.ProfileImg, userID)

		if err == nil {
			success = true
			println("Update succeeded without bio and username")
		} else {
			println("Try 4 failed (no bio, no username):", err.Error())
		}
	}

	// Try 5: Minimal update - just name and phone
	if !success {
		_, err = config.DB.Exec(`
			UPDATE users 
			SET name = ?, phone = ?
			WHERE id = ?
		`, req.Name, req.Phone, userID)

		if err == nil {
			success = true
			println("Update succeeded with minimal fields")
		} else {
			println("Try 5 failed (minimal):", err.Error())
		}
	}

	if !success {
		println("All update attempts failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile: " + err.Error()})
		return
	}

	println("Profile updated successfully for user:", userID)
	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// ================================
// ADMIN: GET ALL USERS (WITH ROLES)
// ================================
func GetAllUsers(c *gin.Context) {
	// Kita buat struct custom untuk response agar ada field Roles
	type UserBasicInfo struct {
		ID         int64  `db:"id" json:"id"`
		Name       string `db:"name" json:"name"`
		Email      string `db:"email" json:"email"`
		Phone      string `db:"phone" json:"phone"`
		ProfileImg string `db:"profile_img" json:"profile_img"`
		Bio        string `db:"bio" json:"bio"`
		AdminLevel int    `db:"admin_level" json:"admin_level"`
	}

	type UserWithRole struct {
		UserBasicInfo
		Roles []string `json:"roles"`
	}

	// 1. Ambil semua user dengan COALESCE untuk handle NULL
	var users []UserBasicInfo
	err := config.DB.Select(&users, `
        SELECT id, name, email, 
               COALESCE(phone, '') as phone, 
               COALESCE(profile_img, '') as profile_img, 
               COALESCE(bio, '') as bio,
               COALESCE(admin_level, 0) as admin_level
        FROM users ORDER BY id DESC
    `)

	if err != nil {
		println("Error fetching users:", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users: " + err.Error()})
		return
	}

	// 2. Ambil semua roles mapping (agar efisien, sekali query)
	type UserRoleMap struct {
		UserID   int64  `db:"user_id"`
		RoleName string `db:"role_name"`
	}
	var roleMaps []UserRoleMap
	config.DB.Select(&roleMaps, `
        SELECT ur.user_id, r.name as role_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
    `)

	// 3. Gabungkan data User + Role
	var result []UserWithRole

	for _, u := range users {
		// Cari role untuk user ini
		var myRoles []string
		for _, rm := range roleMaps {
			if rm.UserID == u.ID {
				myRoles = append(myRoles, rm.RoleName)
			}
		}

		// Append ke hasil akhir
		result = append(result, UserWithRole{
			UserBasicInfo: u,
			Roles:         myRoles,
		})
	}

	c.JSON(http.StatusOK, gin.H{"users": result})
}

// ================================
// ADMIN: GET USER BY ID (DETAIL)
// ================================
func GetUserByID(c *gin.Context) {
	id := c.Param("id")

	// 1. Get user basic info
	type UserBasic struct {
		ID         int64  `db:"id" json:"id"`
		Name       string `db:"name" json:"name"`
		Email      string `db:"email" json:"email"`
		Phone      string `db:"phone" json:"phone"`
		ProfileImg string `db:"profile_img" json:"profile_img"`
		Bio        string `db:"bio" json:"bio"`
		CreatedAt  string `db:"created_at" json:"created_at"`
		AdminLevel int    `db:"admin_level" json:"admin_level"`
	}

	var user UserBasic
	err := config.DB.Get(&user,
		`SELECT id, name, email, COALESCE(phone, '') as phone, 
		        COALESCE(profile_img, '') as profile_img, 
		        COALESCE(bio, '') as bio,
		        COALESCE(created_at, '') as created_at,
		        COALESCE(admin_level, 0) as admin_level
		 FROM users WHERE id = ?`,
		id,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 2. Get user roles
	type RoleInfo struct {
		Name string `db:"name"`
	}
	var roles []RoleInfo
	config.DB.Select(&roles, `
		SELECT r.name FROM roles r
		JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = ?
	`, id)

	var roleNames []string
	for _, r := range roles {
		roleNames = append(roleNames, r.Name)
	}

	// 3. Get events joined (purchases)
	type EventJoined struct {
		EventID       int64   `db:"event_id" json:"event_id"`
		EventTitle    string  `db:"event_title" json:"event_title"`
		SessionsCount int     `db:"sessions_count" json:"sessions_count"`
		TotalPaid     float64 `db:"total_paid" json:"total_paid"`
	}
	var eventsJoined []EventJoined
	config.DB.Select(&eventsJoined, `
		SELECT 
			e.id as event_id,
			e.title as event_title,
			COUNT(p.id) as sessions_count,
			SUM(p.price_paid) as total_paid
		FROM purchases p
		JOIN sessions s ON p.session_id = s.id
		JOIN events e ON s.event_id = e.id
		WHERE p.user_id = ?
		GROUP BY e.id, e.title
		ORDER BY total_paid DESC
	`, id)

	if eventsJoined == nil {
		eventsJoined = []EventJoined{}
	}

	// 4. If organizer, get organization info
	var orgInfo interface{} = nil
	isOrganizer := false
	for _, r := range roleNames {
		if r == "ORGANIZATION" || r == "ORGANIZER" {
			isOrganizer = true
			break
		}
	}

	if isOrganizer {
		type OrgDetail struct {
			ID          int64  `db:"id" json:"id"`
			Name        string `db:"name" json:"name"`
			Category    string `db:"category" json:"category"`
			Description string `db:"description" json:"description"`
			Email       string `db:"email" json:"email"`
			Phone       string `db:"phone" json:"phone"`
			Website     string `db:"website" json:"website"`
			EventsCount int    `db:"events_count" json:"events_count"`
		}

		var org OrgDetail
		err := config.DB.Get(&org, `
			SELECT 
				o.id, 
				COALESCE(o.name, '') as name,
				COALESCE(o.category, '') as category,
				COALESCE(o.description, '') as description,
				COALESCE(o.email, '') as email,
				COALESCE(o.phone, '') as phone,
				COALESCE(o.website, '') as website,
				(SELECT COUNT(*) FROM events WHERE organization_id = o.id) as events_count
			FROM organizations o 
			WHERE o.owner_user_id = ?
		`, id)

		if err == nil {
			// Get org events
			type OrgEvent struct {
				ID            int64  `db:"id" json:"id"`
				Title         string `db:"title" json:"title"`
				PublishStatus string `db:"publish_status" json:"publish_status"`
				SessionsCount int    `db:"sessions_count" json:"sessions_count"`
				BuyersCount   int    `db:"buyers_count" json:"buyers_count"`
			}
			var orgEvents []OrgEvent
			config.DB.Select(&orgEvents, `
				SELECT 
					e.id, 
					e.title,
					COALESCE(e.publish_status, 'DRAFT') as publish_status,
					(SELECT COUNT(*) FROM sessions WHERE event_id = e.id) as sessions_count,
					(SELECT COUNT(DISTINCT p.user_id) FROM purchases p JOIN sessions s ON p.session_id = s.id WHERE s.event_id = e.id) as buyers_count
				FROM events e
				WHERE e.organization_id = ?
				ORDER BY e.created_at DESC
			`, org.ID)

			if orgEvents == nil {
				orgEvents = []OrgEvent{}
			}

			orgInfo = gin.H{
				"id":           org.ID,
				"name":         org.Name,
				"category":     org.Category,
				"description":  org.Description,
				"email":        org.Email,
				"phone":        org.Phone,
				"website":      org.Website,
				"events_count": org.EventsCount,
				"events":       orgEvents,
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":          user.ID,
			"name":        user.Name,
			"email":       user.Email,
			"phone":       user.Phone,
			"profile_img": user.ProfileImg,
			"bio":         user.Bio,
			"created_at":  user.CreatedAt,
			"admin_level": user.AdminLevel,
			"roles":       roleNames,
		},
		"events_joined": eventsJoined,
		"organization":  orgInfo,
	})
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
	Name       string `json:"name"`
	Email      string `json:"email"`
	Password   string `json:"password"`
	Role       string `json:"role"`        // USER, ORGANIZATION, ADMIN
	AdminLevel int    `json:"admin_level"` // 1=Super Admin, 2=Regular Admin (only for ADMIN)
	OrgName    string `json:"org_name"`    // Optional, for ORGANIZATION role
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

	// Determine admin_level
	adminLevel := 0
	if req.Role == "ADMIN" {
		adminLevel = req.AdminLevel
		if adminLevel == 0 {
			adminLevel = 2 // default to regular admin
		}
	}

	// Insert user with admin_level
	res, err := config.DB.Exec(`
		INSERT INTO users (name, email, password_hash, admin_level)
		VALUES (?, ?, ?, ?)
	`, req.Name, req.Email, string(hash), adminLevel)

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

	// If organization, create org profile automatically
	if req.Role == "ORGANIZATION" {
		orgName := req.OrgName
		if orgName == "" {
			orgName = req.Name + "'s Organization"
		}
		_, err = config.DB.Exec(`
			INSERT INTO organizations (owner_user_id, name, status)
			VALUES (?, ?, 'APPROVED')
		`, userID, orgName)
		if err != nil {
			// Log but don't fail
			println("Warning: Failed to create org profile:", err.Error())
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User created successfully",
		"user_id": userID,
		"role":    req.Role,
	})
}

// ================================
// ADMIN: SET USER ROLE (REPLACE, NOT ADD)
// ================================
type SetRoleRequest struct {
	Role       string `json:"role"`        // USER, ORGANIZATION, ADMIN
	AdminLevel int    `json:"admin_level"` // 0=none, 1=super, 2=regular (only for ADMIN)
}

func SetUserRole(c *gin.Context) {
	// Check current admin level
	currentUserID := c.GetInt64("user_id")
	var currentAdminLevel int
	config.DB.Get(&currentAdminLevel, `SELECT COALESCE(admin_level, 0) FROM users WHERE id = ?`, currentUserID)

	targetID := c.Param("id")

	// Cannot change own role
	if fmt.Sprintf("%d", currentUserID) == targetID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Tidak dapat mengubah role sendiri"})
		return
	}

	// Check target user's current admin level
	var targetAdminLevel int
	config.DB.Get(&targetAdminLevel, `SELECT COALESCE(admin_level, 0) FROM users WHERE id = ?`, targetID)

	// Super Admin (level 1) cannot be changed by anyone
	if targetAdminLevel == 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Super Admin tidak dapat diubah rolenya"})
		return
	}

	// Regular Admin (level 2) can only be changed by Super Admin
	if targetAdminLevel == 2 && currentAdminLevel != 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin hanya dapat diubah oleh Super Admin"})
		return
	}

	var req SetRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Regular Admin cannot promote to Super Admin
	if currentAdminLevel == 2 && req.Role == "ADMIN" && req.AdminLevel == 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin biasa tidak dapat mengangkat Super Admin"})
		return
	}

	// Get role IDs
	var userRoleID, orgRoleID, adminRoleID int
	config.DB.Get(&userRoleID, `SELECT id FROM roles WHERE name = 'USER'`)
	config.DB.Get(&orgRoleID, `SELECT id FROM roles WHERE name = 'ORGANIZATION'`)
	config.DB.Get(&adminRoleID, `SELECT id FROM roles WHERE name = 'ADMIN'`)

	if userRoleID == 0 {
		userRoleID = 1
	}
	if orgRoleID == 0 {
		orgRoleID = 2
	}
	if adminRoleID == 0 {
		adminRoleID = 3
	}

	// Delete all existing roles for this user
	config.DB.Exec(`DELETE FROM user_roles WHERE user_id = ?`, targetID)

	// Set new role
	var newRoleID int
	var newAdminLevel int = 0

	switch req.Role {
	case "ADMIN":
		newRoleID = adminRoleID
		newAdminLevel = req.AdminLevel
		if newAdminLevel == 0 {
			newAdminLevel = 2 // default to regular admin
		}
	case "ORGANIZATION":
		newRoleID = orgRoleID
	default:
		newRoleID = userRoleID
	}

	// Insert new role
	_, err := config.DB.Exec(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, targetID, newRoleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set role"})
		return
	}

	// Update admin_level
	config.DB.Exec(`UPDATE users SET admin_level = ? WHERE id = ?`, newAdminLevel, targetID)

	// If setting as organization, create org profile if not exists
	if req.Role == "ORGANIZATION" {
		var existingOrgID int64
		err := config.DB.Get(&existingOrgID, `SELECT id FROM organizations WHERE owner_user_id = ?`, targetID)
		if err != nil {
			// Create new org profile
			config.DB.Exec(`INSERT INTO organizations (owner_user_id, name, status) VALUES (?, '', 'APPROVED')`, targetID)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role berhasil diubah",
		"role":    req.Role,
	})
}

// ================================
// ADMIN: TOGGLE ADMIN ROLE (LEGACY - keep for backward compatibility)
// ================================
func ToggleAdminRole(c *gin.Context) {
	// Redirect to SetUserRole
	c.JSON(http.StatusBadRequest, gin.H{"error": "Gunakan endpoint /set-role dengan body {role, admin_level}"})
}
