package routes

import (
	"BACKEND/controllers"
	"BACKEND/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {

	api := r.Group("/api")

	// ========================
	// AUTH ROUTES
	// ========================
	api.POST("/register", controllers.Register)
	api.POST("/login", controllers.Login)

	// ==========================================
	// STREAMING (VIDEO + FILE) - BYPASS AUTH HEADER
	// ==========================================
	// PENTING: Kita pakai 'api.GET' bukan 'user.GET'
	// supaya tidak kena middleware AuthRequired.
	// Keamanan sudah ditangani oleh token di URL.
	api.GET("/user/sessions/video/:filename", controllers.StreamSessionVideo)
	api.GET("/user/sessions/file/:filename", controllers.StreamSessionFile)

	// ===============================
	// SIGNED URL GENERATORS
	// ===============================
	// Ini tetap butuh login (user.GET) karena user minta linknya lewat aplikasi

	// ========================
	// USER ROUTES (BUTUH LOGIN)
	// ========================
	user := api.Group("/user")
	user.Use(middlewares.AuthRequired())

	// Profile
	user.GET("/profile", controllers.GetMe)
	user.PUT("/profile", controllers.UpdateMe)
	user.POST("/profile/upload-image", controllers.UploadProfileImage)
	user.PUT("/profile/change-password", controllers.ChangePassword)

	// Pembelian sesi
	user.POST("/buy/:sessionID", controllers.BuySession)
	user.GET("/purchases", controllers.MyPurchases)

	// Purchase Check
	user.GET("/sessions/:sessionID/check-purchase", controllers.CheckSessionPurchase)

	// LIST MEDIA (video & file metadata)
	user.GET("/sessions/:sessionID/media",
		middlewares.SessionAccessRequired(),
		controllers.GetUserSessionMedia,
	)

	// Generator URL (Ini butuh login karena generate link rahasia)
	user.GET("/sessions/signed-video/:filename", controllers.GetSignedVideoURL)
	user.GET("/sessions/signed-file/:filename", controllers.GetSignedFileURL)

	// ========================
	// APPLY ORGANIZATION
	// ========================
	api.POST("/organization/apply",
		middlewares.AuthRequired(),
		middlewares.RoleOnly("USER"),
		controllers.ApplyOrganization,
	)

	// ========================
	// ORGANIZATION ROUTES
	// ========================
	org := api.Group("/organization")
	org.Use(middlewares.AuthRequired(), middlewares.OrganizationOnly())

	// profile
	org.GET("/profile", controllers.GetOrganizationProfile)
	org.PUT("/profile", controllers.UpdateOrganizationProfile)

	// Event Management
	org.POST("/events", controllers.CreateEvent)
	org.GET("/events", controllers.ListMyEvents)

	org.GET("/events/:eventID", controllers.GetMyEventDetail)

	// Sessions
	org.POST("/events/:eventID/sessions", controllers.CreateSession)

	// Upload materi
	org.POST("/sessions/:sessionID/videos", controllers.UploadSessionVideo)
	org.POST("/sessions/:sessionID/files", controllers.UploadSessionFile)

	// Ambil media
	org.GET("/sessions/:sessionID/media", controllers.GetSessionMedia)

	// Event Publish
    org.PUT("/events/:id/publish", controllers.PublishEvent)
    org.PUT("/events/:id/unpublish", controllers.UnpublishEvent)
    org.PUT("/events/:id/schedule", controllers.SchedulePublish) // <--- PASTIKAN ADA

    // Session Publish
    org.PUT("/sessions/:sessionID/publish", controllers.PublishSession)
    org.PUT("/sessions/:sessionID/unpublish", controllers.UnpublishSession)
    org.PUT("/sessions/:sessionID/schedule", controllers.ScheduleSessionPublish)

	// PUBLIC EVENT LISTING
	api.GET("/events", controllers.ListPublicEvents)

	// PUBLIC EVENT DETAIL
	api.GET("/events/:eventID", controllers.GetEventDetail)

	// ========================
	// ADMIN ROUTES
	// ========================
	admin := api.Group("/admin")
	admin.Use(middlewares.AuthRequired(), middlewares.AdminOnly())

	admin.GET("/users", controllers.GetAllUsers)
	admin.GET("/users/:id", controllers.GetUserByID)
	admin.PUT("/users/:id", controllers.UpdateUserByAdmin)
	admin.DELETE("/users/:id", controllers.DeleteUser)
	admin.POST("/users", controllers.CreateUserByAdmin)

	admin.GET("/organization/applications", controllers.GetAllOrganizationApplications)
	admin.GET("/organization/applications/:id", controllers.GetOrganizationApplicationByID)
	admin.POST("/organization/applications/:id/review", controllers.ReviewOrganizationApplication)
}
