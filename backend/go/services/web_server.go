package services

import (
	"context"
	"errors"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"inquery/go/pkg/util"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	httpServerReadTimeout         = 30 * time.Second
	httpServerWriteTimeout        = 30 * time.Second
	httpDefaultAuthorizationToken = "inquery"
	httpDefaultServerPort         = "3003"
	httpDefaultAllowOrigins       = "*"
)

var authorizationHeaderToken string

func InitWebServer(ctx context.Context) error {
	util.Log.Debugw("Starting API server")
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()

	allowOrigins := strings.Split(os.Getenv("HTTP_API_SERVER_CORS_ALLOW_ORIGINS"), ",")
	if len(allowOrigins[0]) == 0 {
		allowOrigins = []string{httpDefaultAllowOrigins}
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Accept"},
		AllowCredentials: true,
		AllowWildcard:    true,
		MaxAge:           12 * time.Hour,
	}))
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	port := os.Getenv("HTTP_API_SERVER_PORT")
	if len(port) == 0 {
		port = httpDefaultServerPort
	}
	authorizationHeaderToken = os.Getenv("HTTP_API_SERVER_AUTH_TOKEN")
	if len(authorizationHeaderToken) == 0 {
		authorizationHeaderToken = httpDefaultAuthorizationToken
	}
	server := &http.Server{
		Addr:           fmt.Sprintf(":%s", port),
		Handler:        router,
		ReadTimeout:    httpServerReadTimeout,
		WriteTimeout:   httpServerWriteTimeout,
		MaxHeaderBytes: 1 << 20,
	}

	/* ---------------------------  Public routes  --------------------------- */

	public := router.Group("/api")
	public.GET("/health", Health)

	/* ---------------------------  Private routes  --------------------------- */

	v1 := router.Group("/api/v1")
	v1.Use(AuthMiddleware())

	/* Connection */
	v1.GET("/connection", ConnectionGet)
	v1.POST("/connection", ConnectionCreate)
	v1.DELETE("/connection", ConnectionDelete)
	/* Action */
	v1.GET("/action/list", ActionList)
	v1.GET("/action", ActionGet)
	v1.POST("/action", ActionCreate)
	v1.DELETE("/action", ActionDelete)
	/* Table */
	v1.GET("/table/list", TableList)
	/* Database User */
	v1.GET("/db-user/list", DatabaseUserList)
	/* Audit */
	v1.GET("/audit/list", AuditList)

	// Initialize the server in a goroutine so that it won't block shutdown handling
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			util.Log.Debugw("HTTP server closed", "error", err)
		}
	}()
	util.Log.Debugw("API server started")
	go func() {
		defer ShutdownWaitGroup.Done()
		for {
			select {
			case <-ctx.Done():
				if err := server.Shutdown(ctx); err != nil {
					util.Log.Fatalw("API server forced to shutdown", "error", err)
				}
				util.Log.Debugw("API server shutdown")
				return
			}
		}
	}()
	return nil
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if len(authorizationHeaderToken) == 0 {
			// If not authorization header token is provided in the env, allow unauthenticated requests
			return
		}
		authorizationHeader := c.GetHeader("Authorization")
		if len(authorizationHeader) == 0 {
			util.Log.Debugw("Missing authorization header in request")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		if authorizationHeader != authorizationHeaderToken {
			util.Log.Debugw("Unable to authorize user")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
	}
}
