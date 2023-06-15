package web

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func initializePublicRoutes(router *gin.Engine) {

	/* ---------------------------  Public routes  --------------------------- */

	public := router.Group("/public")
	// Swagger API docs (accessible at /public/swagger/index.html)
	public.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	// Used for external status health checks (i.e. AWS)
	public.GET("/health", health)
}
