package middlewares

import (
	"BACKEND/config"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AffiliateOnly ensures the user has AFFILIATE role
func AffiliateOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt64("user_id")
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Check if user has AFFILIATE role
		var count int
		err := config.DB.Get(&count, `
			SELECT COUNT(*) FROM user_roles ur
			JOIN roles r ON ur.role_id = r.id
			WHERE ur.user_id = ? AND r.name = 'AFFILIATE'
		`, userID)

		if err != nil || count == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses khusus affiliate"})
			c.Abort()
			return
		}

		c.Next()
	}
}
