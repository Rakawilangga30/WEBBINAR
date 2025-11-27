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

	// ========================
	// USER PROFILE ROUTES
	// ========================
	user := api.Group("/user")
	user.Use(middlewares.AuthRequired())

	user.GET("/profile", controllers.GetMe)
	user.PUT("/profile", controllers.UpdateMe)
	user.POST("/profile/upload-image", controllers.UploadProfileImage)
	user.PUT("/profile/change-password", controllers.ChangePassword)

	// ========================
	// APPLY ORGANIZATION (USER ONLY)
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

	org.GET("/profile", controllers.GetOrganizationProfile)
	org.PUT("/profile", controllers.UpdateOrganizationProfile)

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
