package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"BACKEND/config"
)

// ================================
// ADMIN: GET ALL ORGANIZATIONS
// ================================
func GetAllOrganizations(c *gin.Context) {
	type OrgWithOwner struct {
		ID          int64  `db:"id" json:"id"`
		Name        string `db:"name" json:"name"`
		Category    string `db:"category" json:"category"`
		Description string `db:"description" json:"description"`
		LogoURL     string `db:"logo_url" json:"logo_url"`
		Email       string `db:"email" json:"email"`
		Phone       string `db:"phone" json:"phone"`
		Website     string `db:"website" json:"website"`
		OwnerID     int64  `db:"owner_id" json:"owner_id"`
		OwnerName   string `db:"owner_name" json:"owner_name"`
		OwnerEmail  string `db:"owner_email" json:"owner_email"`
		EventCount  int    `db:"event_count" json:"event_count"`
	}

	var organizations []OrgWithOwner
	err := config.DB.Select(&organizations, `
		SELECT 
			o.id, o.name, 
			COALESCE(o.category, '') as category,
			COALESCE(o.description, '') as description,
			COALESCE(o.logo_url, '') as logo_url,
			COALESCE(o.email, '') as email,
			COALESCE(o.phone, '') as phone,
			COALESCE(o.website, '') as website,
			o.owner_user_id as owner_id,
			u.name as owner_name,
			u.email as owner_email,
			(SELECT COUNT(*) FROM events WHERE organization_id = o.id) as event_count
		FROM organizations o
		JOIN users u ON o.owner_user_id = u.id
		ORDER BY o.id DESC
	`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organizations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"organizations": organizations})
}

// ================================
// ADMIN: GET ORGANIZATION DETAIL
// ================================
func GetOrganizationDetailAdmin(c *gin.Context) {
	orgID := c.Param("id")

	// 1. Get organization info
	type OrgInfo struct {
		ID          int64  `db:"id" json:"id"`
		Name        string `db:"name" json:"name"`
		Category    string `db:"category" json:"category"`
		Description string `db:"description" json:"description"`
		LogoURL     string `db:"logo_url" json:"logo_url"`
		Email       string `db:"email" json:"email"`
		Phone       string `db:"phone" json:"phone"`
		Website     string `db:"website" json:"website"`
		OwnerID     int64  `db:"owner_id" json:"owner_id"`
		OwnerName   string `db:"owner_name" json:"owner_name"`
		OwnerEmail  string `db:"owner_email" json:"owner_email"`
	}

	var org OrgInfo
	err := config.DB.Get(&org, `
		SELECT 
			o.id, o.name, 
			COALESCE(o.category, '') as category,
			COALESCE(o.description, '') as description,
			COALESCE(o.logo_url, '') as logo_url,
			COALESCE(o.email, '') as email,
			COALESCE(o.phone, '') as phone,
			COALESCE(o.website, '') as website,
			o.owner_user_id as owner_id,
			u.name as owner_name,
			u.email as owner_email
		FROM organizations o
		JOIN users u ON o.owner_user_id = u.id
		WHERE o.id = ?
	`, orgID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	// 2. Get events
	type EventInfo struct {
		ID            int64  `db:"id" json:"id"`
		Title         string `db:"title" json:"title"`
		ThumbnailURL  string `db:"thumbnail_url" json:"thumbnail_url"`
		PublishStatus string `db:"publish_status" json:"publish_status"`
	}

	var events []EventInfo
	config.DB.Select(&events, `
		SELECT id, title, COALESCE(thumbnail_url, '') as thumbnail_url, 
		       COALESCE(publish_status, 'DRAFT') as publish_status
		FROM events 
		WHERE organization_id = ?
		ORDER BY id DESC
	`, orgID)

	// 3. Get sessions for each event
	type SessionInfo struct {
		ID            int64  `db:"id" json:"id"`
		EventID       int64  `db:"event_id" json:"event_id"`
		Title         string `db:"title" json:"title"`
		Price         int64  `db:"price" json:"price"`
		PublishStatus string `db:"publish_status" json:"publish_status"`
	}

	var sessions []SessionInfo
	config.DB.Select(&sessions, `
		SELECT s.id, s.event_id, s.title, COALESCE(s.price, 0) as price,
		       COALESCE(s.publish_status, 'DRAFT') as publish_status
		FROM sessions s
		JOIN events e ON s.event_id = e.id
		WHERE e.organization_id = ?
		ORDER BY s.event_id, s.order_index
	`, orgID)

	c.JSON(http.StatusOK, gin.H{
		"organization": org,
		"events":       events,
		"sessions":     sessions,
	})
}

// ================================
// ADMIN: GET SESSION MEDIA (Bypass purchase)
// ================================
func GetSessionMediaAdmin(c *gin.Context) {
	sessionID := c.Param("sessionId")

	// Get videos
	type VideoInfo struct {
		ID       int64  `db:"id" json:"id"`
		VideoURL string `db:"video_url" json:"video_url"`
		Title    string `db:"title" json:"title"`
	}

	var videos []VideoInfo
	config.DB.Select(&videos, `
		SELECT id, video_url, COALESCE(title, video_url) as title
		FROM session_videos
		WHERE session_id = ?
		ORDER BY order_index, id
	`, sessionID)

	// Get files
	type FileInfo struct {
		ID      int64  `db:"id" json:"id"`
		FileURL string `db:"file_url" json:"file_url"`
		Title   string `db:"title" json:"title"`
	}

	var files []FileInfo
	config.DB.Select(&files, `
		SELECT id, file_url, COALESCE(title, file_url) as title
		FROM session_files
		WHERE session_id = ?
		ORDER BY order_index, id
	`, sessionID)

	c.JSON(http.StatusOK, gin.H{
		"videos": videos,
		"files":  files,
	})
}

// ================================
// ADMIN: UPDATE ORGANIZATION
// ================================
type UpdateOrgRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Website     string `json:"website"`
	Reason      string `json:"reason"` // Alasan perubahan
}

func UpdateOrganizationByAdmin(c *gin.Context) {
	orgID := c.Param("id")

	var req UpdateOrgRequest
	if c.ShouldBindJSON(&req) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := config.DB.Exec(`
		UPDATE organizations 
		SET name=?, description=?, category=?, email=?, phone=?, website=?
		WHERE id=?
	`, req.Name, req.Description, req.Category, req.Email, req.Phone, req.Website, orgID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update organization"})
		return
	}

	// Notify owner about update
	var ownerID int64
	config.DB.Get(&ownerID, "SELECT owner_user_id FROM organizations WHERE id = ?", orgID)
	if ownerID > 0 {
		message := "Admin telah memperbarui informasi organisasi \"" + req.Name + "\"."
		if req.Reason != "" {
			message += " Alasan: " + req.Reason
		}
		CreateNotification(
			ownerID,
			"organization_updated",
			"🏢 Organisasi Diperbarui",
			message,
		)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Organization updated successfully"})
}

// ================================
// ADMIN: DELETE ORGANIZATION
// ================================
type DeleteOrgRequest struct {
	Reason string `json:"reason"` // Alasan penghapusan
}

func DeleteOrganization(c *gin.Context) {
	orgID := c.Param("id")

	var req DeleteOrgRequest
	c.ShouldBindJSON(&req)

	// Get org info for notification
	var orgInfo struct {
		Name    string `db:"name"`
		OwnerID int64  `db:"owner_user_id"`
	}
	config.DB.Get(&orgInfo, "SELECT name, owner_user_id FROM organizations WHERE id = ?", orgID)

	// Notify owner BEFORE deletion
	if orgInfo.OwnerID > 0 {
		message := "Organisasi \"" + orgInfo.Name + "\" telah dihapus oleh admin."
		if req.Reason != "" {
			message += " Alasan: " + req.Reason
		}
		CreateNotification(
			orgInfo.OwnerID,
			"organization_deleted",
			"🗑️ Organisasi Dihapus",
			message,
		)
	}

	// Delete organization (cascade will handle events, sessions, etc.)
	_, err := config.DB.Exec("DELETE FROM organizations WHERE id = ?", orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete organization"})
		return
	}

	// Remove ORGANIZATION role from owner
	config.DB.Exec(`
		DELETE FROM user_roles 
		WHERE user_id = ? AND role_id = (SELECT id FROM roles WHERE name = 'ORGANIZATION')
	`, orgInfo.OwnerID)

	// Add back USER role
	config.DB.Exec(`
		INSERT INTO user_roles (user_id, role_id) 
		SELECT ?, id FROM roles WHERE name = 'USER'
	`, orgInfo.OwnerID)

	c.JSON(http.StatusOK, gin.H{"message": "Organization deleted successfully"})
}
