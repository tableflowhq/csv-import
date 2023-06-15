package web

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/util"
)

func initializeAPIRoutes(router *gin.Engine) {

	/* ---------------------------  API routes  --------------------------- */

	api := router.Group("/api/v1")
	api.Use(apiKeyAuthMiddleware())

	/* Import */
	api.GET("/import/:id", getImportForExternalAPI)
	api.GET("/import/:id/download", downloadImportForExternalAPI)
}

func apiKeyAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if len(authHeader) == 0 {
			util.Log.Infow("Missing authorization header in request", "host", c.Request.Host, "referer", c.Request.Referer(), "uri", c.Request.RequestURI, "user_agent", c.Request.UserAgent())
			c.AbortWithStatusJSON(http.StatusUnauthorized, Res{Message: "unauthorized"})
			return
		}
		authHeader = strings.ToLower(authHeader)
		authHeaderParts := strings.SplitN(authHeader, " ", 2)
		if len(authHeaderParts) != 2 || authHeaderParts[0] != "bearer" || len(authHeaderParts[1]) == 0 {
			util.Log.Infow("Malformed authorization header in request", "host", c.Request.Host, "referer", c.Request.Referer(), "uri", c.Request.RequestURI, "user_agent", c.Request.UserAgent())
			c.AbortWithStatusJSON(http.StatusUnauthorized, Res{Message: "unauthorized"})
			return
		}
		apiKey := authHeaderParts[1]
		workspaceID, err := db.GetWorkspaceIDFromAPIKey(apiKey)
		if err != nil || len(workspaceID) == 0 {
			util.Log.Infow("Unable to authorize API key", "host", c.Request.Host, "referer", c.Request.Referer(), "uri", c.Request.RequestURI, "user_agent", c.Request.UserAgent())
			c.AbortWithStatusJSON(http.StatusUnauthorized, Res{Message: "unauthorized"})
			return
		}
		c.Set("workspace_id", workspaceID)
	}
}
