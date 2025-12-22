package middlewares

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"BACKEND/helpers"
)

// AuthRequired: Cek token valid & simpan data ke Context
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := helpers.ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		// Simpan UserID dan Roles ke context agar bisa dipakai di controller
		c.Set("user_id", claims.UserID)
		c.Set("roles", claims.Roles) // <--- Simpan array roles

		c.Next()
	}
}

// RoleOnly: Cek apakah user punya role tertentu (misal: ADMIN)
func RoleOnly(allowedRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		rolesInterface, exists := c.Get("roles")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		// Cek apakah allowedRole ada di dalam list roles user
		userRoles := rolesInterface.([]string)
		hasRole := false
		for _, r := range userRoles {
			if r == allowedRole {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "You don't have permission"})
			return
		}

		c.Next()
	}
}

// Helper khusus untuk Organization & Admin (Shortcut)
func OrganizationOnly() gin.HandlerFunc {
	return RoleOnly("ORGANIZATION")
}

func AdminOnly() gin.HandlerFunc {
	return RoleOnly("ADMIN")
}