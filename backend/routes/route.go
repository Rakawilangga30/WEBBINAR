package routes

import (
	"BACKEND/controllers"
	"BACKEND/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {

	// Group utama: /api
	api := r.Group("/api")

	// ==========================================
	// 1. PUBLIC ROUTES (Tanpa Login)
	// ==========================================
	{
		// Authentication
		api.POST("/register", controllers.Register)
		api.POST("/login", controllers.Login)

		// Public Event Listing (Home & Upcoming)
		api.GET("/events", controllers.ListPublicEvents)

		// Public Event Detail (Preview silabus & info event)
		api.GET("/events/:eventID", controllers.GetEventDetail)

		// Streaming (Bypass Auth Header)
		// Token dikirim via query param (?token=...)
		api.GET("/user/sessions/video/:filename", controllers.StreamSessionVideo)
		api.GET("/user/sessions/file/:filename", controllers.StreamSessionFile)
	}

	// ==========================================
	// 2. USER ROUTES (Login: USER, ORGANIZER, ADMIN)
	// ==========================================
	user := api.Group("/user")
	user.Use(middlewares.AuthRequired()) // Semua di bawah ini butuh Login
	{
		// Profile Management
		user.GET("/profile", controllers.GetMe)
		user.PUT("/profile", controllers.UpdateMe)
		user.POST("/profile/upload-image", controllers.UploadProfileImage)
		user.PUT("/profile/change-password", controllers.ChangePassword)

		// Transaction / Pembelian
		user.POST("/buy/:sessionID", controllers.BuySession)
		user.GET("/purchases", controllers.MyPurchases)
		user.GET("/sessions/:sessionID/check-purchase", controllers.CheckSessionPurchase)

		// Akses Materi (Dengan Pengecekan Pembelian)
		user.GET("/sessions/:sessionID/media",
			middlewares.SessionAccessRequired(), // Middleware khusus cek beli
			controllers.GetUserSessionMedia,
		)

		// Generator Signed URL (Untuk streaming aman)
		user.GET("/sessions/signed-video/:filename", controllers.GetSignedVideoURL)
		user.GET("/sessions/signed-file/:filename", controllers.GetSignedFileURL)
	}

	// ==========================================
	// 3. REGISTRATION ROUTE (SPECIAL CASE)
	// ==========================================
	// Route ini ada di path /organization tapi diakses oleh USER biasa.
	// Kita taruh di luar grup 'org' agar tidak terblokir middleware OrganizationOnly.
	api.POST("/organization/apply",
		middlewares.AuthRequired(),
		middlewares.RoleOnly("USER"), // Hanya user biasa yang boleh daftar jadi organizer
		controllers.ApplyOrganization,
	)

	// ==========================================
	// 4. ORGANIZATION ROUTES (Login + Role: ORGANIZER)
	// ==========================================
	org := api.Group("/organization")
	org.Use(middlewares.AuthRequired(), middlewares.OrganizationOnly())
	{
		// Org Profile
		org.GET("/profile", controllers.GetOrganizationProfile)
		org.PUT("/profile", controllers.UpdateOrganizationProfile)

		// Event Management
		org.POST("/events", controllers.CreateEvent)
		org.PUT("/events/:eventID", controllers.UpdateEvent)
		org.POST("/events/:eventID/thumbnail", controllers.UploadEventThumbnail)
		org.GET("/events", controllers.ListMyEvents)
		org.GET("/events/:eventID", controllers.GetMyEventDetailForManage) // Detail khusus owner

		// Event Publishing
		org.PUT("/events/:eventID/publish", controllers.PublishEvent)
		org.PUT("/events/:eventID/unpublish", controllers.UnpublishEvent)
		org.PUT("/events/:eventID/schedule", controllers.SchedulePublish)

		// Session Management
		org.POST("/events/:eventID/sessions", controllers.CreateSession)

		// Session Publishing
		org.PUT("/sessions/:sessionID/publish", controllers.PublishSession)
		org.PUT("/sessions/:sessionID/unpublish", controllers.UnpublishSession)
		org.PUT("/sessions/:sessionID/schedule", controllers.ScheduleSessionPublish)

		// Upload Materi
		org.POST("/sessions/:sessionID/videos", controllers.UploadSessionVideo)
		org.POST("/sessions/:sessionID/files", controllers.UploadSessionFile)

		// Preview Materi (Tanpa cek pembelian, karena dia pemilik)
		org.GET("/sessions/:sessionID/media", controllers.GetSessionMedia)
	}

	// ==========================================
	// 5. ADMIN ROUTES (Login + Role: ADMIN)
	// ==========================================
	admin := api.Group("/admin")
	admin.Use(middlewares.AuthRequired(), middlewares.AdminOnly())
	{
		// User Management
		admin.GET("/users", controllers.GetAllUsers)
		admin.GET("/users/:id", controllers.GetUserByID)
		admin.POST("/users", controllers.CreateUserByAdmin)
		admin.PUT("/users/:id", controllers.UpdateUserByAdmin)
		admin.DELETE("/users/:id", controllers.DeleteUser)

		// Organization Approval
		admin.GET("/organization/applications", controllers.GetAllOrganizationApplications)
		admin.GET("/organization/applications/:id", controllers.GetOrganizationApplicationByID)
		admin.POST("/organization/applications/:id/review", controllers.ReviewOrganizationApplication)
	}
}
