package web

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
	"tableflow/go/pkg/routes"
	"tableflow/go/pkg/util"
)

func ApiKeyAuthMiddleware(isAuthorized func(c *gin.Context, apiKey string) bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if len(authHeader) == 0 {
			util.Log.Infow("Missing authorization header in request", "host", c.Request.Host, "referer", c.Request.Referer(), "uri", c.Request.RequestURI, "user_agent", c.Request.UserAgent())
			c.AbortWithStatusJSON(http.StatusUnauthorized, routes.Res{Message: "unauthorized"})
			return
		}
		authHeader = strings.ToLower(authHeader)
		authHeaderParts := strings.SplitN(authHeader, " ", 2)
		if len(authHeaderParts) != 2 || authHeaderParts[0] != "bearer" || len(authHeaderParts[1]) == 0 {
			util.Log.Infow("Malformed authorization header in request", "host", c.Request.Host, "referer", c.Request.Referer(), "uri", c.Request.RequestURI, "user_agent", c.Request.UserAgent())
			c.AbortWithStatusJSON(http.StatusUnauthorized, routes.Res{Message: "unauthorized"})
			return
		}
		if !isAuthorized(c, authHeaderParts[1]) {
			util.Log.Infow("Unable to authorize API key", "host", c.Request.Host, "referer", c.Request.Referer(), "uri", c.Request.RequestURI, "user_agent", c.Request.UserAgent())
			c.AbortWithStatusJSON(http.StatusUnauthorized, routes.Res{Message: "unauthorized"})
			return
		}
	}
}
