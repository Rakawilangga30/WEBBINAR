package routes

import (
	"BACKEND/controllers"
	"BACKEND/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {

	api := r.Group("/api")

	// ==========================================
	// 1. PUBLIC ROUTES
	// ==========================================
	{
		api.POST("/register", controllers.Register)
		api.POST("/login", controllers.Login)
		api.GET("/events", controllers.ListPublicEvents)
		api.GET("/events/:eventID", controllers.GetEventDetail)

		api.GET("/user/sessions/video/:filename", controllers.StreamSessionVideo)
		api.GET("/user/sessions/file/:filename", controllers.StreamSessionFile)

		api.GET("/config/midtrans", controllers.GetMidtransConfig)
		api.POST("/webhook/midtrans", controllers.HandleMidtransNotification)
	}

	// ==========================================
	// 2. USER ROUTES (PROTECTED)
	// ==========================================
	userGroup := api.Group("/user")
	userGroup.Use(middlewares.AuthRequired())
	{
		userGroup.GET("/profile", controllers.GetMe)
		userGroup.PUT("/profile", controllers.UpdateMe)
		userGroup.POST("/profile/upload-image", controllers.UploadProfileImage)
		userGroup.PUT("/profile/change-password", controllers.ChangePassword)

		userGroup.POST("/buy/:sessionID", controllers.BuySession)
		userGroup.GET("/purchases", controllers.MyPurchases)
		userGroup.GET("/sessions/:sessionID/check-purchase", controllers.CheckSessionPurchase)

		userGroup.GET("/sessions/:sessionID/media",
			middlewares.SessionAccessRequired(),
			controllers.GetUserSessionMedia,
		)
		userGroup.GET("/sessions/signed-video/:filename", controllers.GetSignedVideoURL)
		userGroup.GET("/sessions/signed-file/:filename", controllers.GetSignedFileURL)

		userGroup.GET("/notifications", controllers.GetMyNotifications)
		userGroup.PUT("/notifications/:id/read", controllers.MarkNotificationAsRead)
		userGroup.PUT("/notifications/read-all", controllers.MarkAllNotificationsAsRead)

		userGroup.POST("/payment/token", controllers.GetPaymentToken)

		// Quiz & Certificate for users
		userGroup.GET("/events/:eventID/progress", controllers.GetUserEventProgress)
		userGroup.GET("/sessions/:sessionID/quiz", controllers.GetQuizForUser)
		userGroup.POST("/sessions/:sessionID/quiz/submit", controllers.SubmitQuiz)
		userGroup.GET("/events/:eventID/certificate", controllers.GetUserCertificate)
	}

	// ==========================================
	// 3. APPLY ORGANIZATION (USER needs to apply first)
	// ==========================================
	api.POST("/organization/apply",
		middlewares.AuthRequired(),
		middlewares.RoleOnly("USER"),
		controllers.ApplyOrganization,
	)
	api.GET("/organization/my-application",
		middlewares.AuthRequired(),
		controllers.GetMyApplicationStatus,
	)

	// ==========================================
	// 4. AFFILIATE ROUTES (Any logged-in user can submit)
	// User gets AFFILIATE role when their first event is approved
	// ==========================================
	affiliate := api.Group("/affiliate")
	affiliate.Use(middlewares.AuthRequired())
	{
		// Submit event - any user can do this
		affiliate.POST("/submit-event", controllers.SubmitAffiliateEvent)

		// Dashboard & events - only for users who have submitted (data filtered by user_id)
		affiliate.GET("/dashboard", controllers.GetAffiliateDashboard)
		affiliate.GET("/events", controllers.GetAffiliateEvents)
		affiliate.GET("/events/:id", controllers.GetAffiliateSubmissionDetail)
	}

	// ==========================================
	// 5. ORGANIZATION ROUTES
	// ==========================================
	org := api.Group("/organization")
	org.Use(middlewares.AuthRequired(), middlewares.OrganizationOnly())
	{
		org.GET("/profile", controllers.GetOrganizationProfile)
		org.PUT("/profile", controllers.UpdateOrganizationProfile)
		org.POST("/profile/logo", controllers.UploadOrganizationLogo)
		org.GET("/report", controllers.GetOrganizationReport)
		org.GET("/events/:eventID/buyers", controllers.GetEventBuyers)

		org.POST("/events", controllers.CreateEvent)
		org.PUT("/events/:eventID", controllers.UpdateEvent)
		org.DELETE("/events/:eventID", controllers.DeleteEvent)

		org.POST("/events/:eventID/thumbnail", controllers.UploadEventThumbnail)
		org.GET("/events", controllers.ListMyEvents)
		org.GET("/events/:eventID", controllers.GetMyEventDetailForManage)

		org.PUT("/events/:eventID/publish", controllers.PublishEvent)
		org.PUT("/events/:eventID/unpublish", controllers.UnpublishEvent)
		org.PUT("/events/:eventID/schedule", controllers.SchedulePublish)

		org.POST("/events/:eventID/sessions", controllers.CreateSession)
		org.PUT("/sessions/:sessionID/publish", controllers.PublishSession)
		org.PUT("/sessions/:sessionID/unpublish", controllers.UnpublishSession)
		org.PUT("/sessions/:sessionID/schedule", controllers.ScheduleSessionPublish)
		org.PUT("/sessions/:sessionID", controllers.UpdateSession)
		org.DELETE("/sessions/:sessionID", controllers.DeleteSession)

		org.POST("/sessions/:sessionID/videos", controllers.UploadSessionVideo)
		org.POST("/sessions/:sessionID/files", controllers.UploadSessionFile)
		org.PUT("/sessions/:sessionID/videos/:mediaID", controllers.UpdateSessionVideo)
		org.PUT("/sessions/:sessionID/files/:mediaID", controllers.UpdateSessionFile)
		org.DELETE("/sessions/:sessionID/videos/:mediaID", controllers.DeleteSessionVideo)
		org.DELETE("/sessions/:sessionID/files/:mediaID", controllers.DeleteSessionFile)

		org.GET("/sessions/:sessionID/media", controllers.GetSessionMedia)

		// Quiz & Certificate
		org.GET("/events/:eventID/certificate-settings", controllers.GetCertificateSettings)
		org.PUT("/events/:eventID/certificate-settings", controllers.UpdateCertificateSettings)
		org.GET("/sessions/:sessionID/quiz", controllers.GetSessionQuiz)
		org.POST("/sessions/:sessionID/quiz", controllers.SaveSessionQuiz)
		org.DELETE("/sessions/:sessionID/quiz", controllers.DeleteSessionQuiz)
	}

	// ==========================================
	// 6. ADMIN ROUTES
	// ==========================================
	admin := api.Group("/admin")
	admin.Use(middlewares.AuthRequired(), middlewares.AdminOnly())
	{
		admin.GET("/users", controllers.GetAllUsers)
		admin.GET("/users/:id", controllers.GetUserByID)
		admin.POST("/users", controllers.CreateUserByAdmin)
		admin.PUT("/users/:id", controllers.UpdateUserByAdmin)
		admin.DELETE("/users/:id", controllers.DeleteUser)
		admin.POST("/users/:id/toggle-admin", controllers.ToggleAdminRole)
		admin.POST("/users/:id/set-role", controllers.SetUserRole)

		admin.GET("/organization/applications", controllers.GetAllOrganizationApplications)
		admin.GET("/organization/applications/:id", controllers.GetOrganizationApplicationByID)
		admin.POST("/organization/applications/:id/review", controllers.ReviewOrganizationApplication)

		admin.GET("/organizations", controllers.GetAllOrganizations)
		admin.GET("/organizations/:id", controllers.GetOrganizationDetailAdmin)
		admin.PUT("/organizations/:id", controllers.UpdateOrganizationByAdmin)
		admin.GET("/organizations/:id/sessions/:sessionId/media", controllers.GetSessionMediaAdmin)
		admin.DELETE("/organizations/:id", controllers.DeleteOrganization)

		// Admin Affiliate Submissions
		admin.GET("/affiliate/submissions", controllers.GetAllAffiliateSubmissions)
		admin.GET("/affiliate/submissions/:id", controllers.GetAffiliateSubmissionByID)
		admin.POST("/affiliate/submissions/:id/review", controllers.ReviewAffiliateSubmission)

		// Admin Affiliate Ledgers
		admin.GET("/affiliate/ledgers", controllers.GetAffiliateLedgers)
		admin.POST("/affiliate/ledgers/:id/payout", controllers.MarkAffiliatePaidOut)
		admin.GET("/affiliate/stats", controllers.GetAffiliateLedgerStats)

		// Admin Official Organization
		admin.GET("/official-org", controllers.GetOfficialOrganization)
		admin.PUT("/official-org", controllers.UpdateOfficialOrganization)
		admin.POST("/official-org/logo", controllers.UploadOfficialOrgLogo)

		// Official Org - Events CRUD
		admin.GET("/official-org/events", controllers.GetOfficialOrgEvents)
		admin.POST("/official-org/events", controllers.CreateOfficialOrgEvent)
		admin.GET("/official-org/events/:eventId", controllers.GetOfficialOrgEventDetail)
		admin.PUT("/official-org/events/:eventId", controllers.UpdateOfficialOrgEvent)
		admin.DELETE("/official-org/events/:eventId", controllers.DeleteOfficialOrgEvent)
		admin.POST("/official-org/events/:eventId/thumbnail", controllers.UploadOfficialOrgEventThumbnail)

		// Official Org - Event Publish/Unpublish/Schedule
		admin.PUT("/official-org/events/:eventId/publish", controllers.PublishOfficialOrgEvent)
		admin.PUT("/official-org/events/:eventId/unpublish", controllers.UnpublishOfficialOrgEvent)
		admin.PUT("/official-org/events/:eventId/schedule", controllers.ScheduleOfficialOrgEvent)

		// Official Org - Sessions CRUD
		admin.POST("/official-org/events/:eventId/sessions", controllers.CreateOfficialOrgSession)
		admin.PUT("/official-org/sessions/:sessionId", controllers.UpdateOfficialOrgSession)
		admin.DELETE("/official-org/sessions/:sessionId", controllers.DeleteOfficialOrgSession)

		// Official Org - Session Publish/Unpublish/Schedule
		admin.PUT("/official-org/sessions/:sessionId/publish", controllers.PublishOfficialOrgSession)
		admin.PUT("/official-org/sessions/:sessionId/unpublish", controllers.UnpublishOfficialOrgSession)
		admin.PUT("/official-org/sessions/:sessionId/schedule", controllers.ScheduleOfficialOrgSession)

		// Official Org - Session Materials
		admin.POST("/official-org/sessions/:sessionId/videos", controllers.UploadOfficialOrgSessionVideo)
		admin.POST("/official-org/sessions/:sessionId/files", controllers.UploadOfficialOrgSessionFile)
		admin.PUT("/official-org/videos/:videoId", controllers.UpdateOfficialOrgVideo)
		admin.DELETE("/official-org/videos/:videoId", controllers.DeleteOfficialOrgVideo)
		admin.PUT("/official-org/files/:fileId", controllers.UpdateOfficialOrgFile)
		admin.DELETE("/official-org/files/:fileId", controllers.DeleteOfficialOrgFile)

		// Official Org - Quiz & Certificate
		admin.GET("/official-org/events/:eventId/certificate-settings", controllers.GetOfficialOrgCertificateSettings)
		admin.PUT("/official-org/events/:eventId/certificate-settings", controllers.UpdateOfficialOrgCertificateSettings)
		admin.GET("/official-org/sessions/:sessionId/quiz", controllers.GetOfficialOrgSessionQuiz)
		admin.POST("/official-org/sessions/:sessionId/quiz", controllers.SaveOfficialOrgSessionQuiz)
		admin.DELETE("/official-org/sessions/:sessionId/quiz", controllers.DeleteOfficialOrgSessionQuiz)
	}
}
