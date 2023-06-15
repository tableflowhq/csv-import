package web

import (
	"context"
	"errors"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/supertokens/supertokens-golang/supertokens"
	"net/http"
	_ "tableflow/docs"
	"tableflow/go/pkg/env"
	"tableflow/go/pkg/util"
	"tableflow/go/services"
	"time"
)

//	@title						TableFlow API
//	@version					1.0
//	@description				The backend API of the TableFlow application.
//	@termsOfService				https://tableflow.com/terms/
//	@contact.name				TableFlow
//	@contact.url				https://tableflow.com
//	@contact.email				support@tableflow.com
//	@host						localhost:3003
//	@BasePath					/
//	@securityDefinitions.apikey	ApiKeyAuth
//	@in							header
//	@name						Authorization

const (
	httpServerReadTimeout  = 120 * time.Second
	httpServerWriteTimeout = 120 * time.Second
	importerDefaultOrigin  = "https://importer.tableflow.com"
)

func InitWebServer(ctx context.Context) error {
	util.Log.Debugw("Starting API server")
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{importerDefaultOrigin, env.WebAppURL},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders: append([]string{"Accept", "Authorization", "X-Requested-With", "X-Request-ID",
			"X-HTTP-Method-Override", "Upload-Length", "Upload-Offset", "Tus-Resumable", "Upload-Metadata",
			"Upload-Defer-Length", "Upload-Concat", "User-Agent", "Referrer", "Origin", "Content-Type", "Content-Length",
			"X-Importer-ID", "X-Import-Metadata"},
			supertokens.GetAllCORSHeaders()...),
		ExposeHeaders: []string{"Upload-Offset", "Location", "Upload-Length", "Tus-Version", "Tus-Resumable",
			"Tus-Max-Size", "Tus-Extension", "Upload-Metadata", "Upload-Defer-Length", "Upload-Concat", "Location",
			"Upload-Offset", "Upload-Length"},
		AllowCredentials: true,
		AllowWildcard:    true,
		MaxAge:           12 * time.Hour,
	}))
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(func(c *gin.Context) {
		supertokens.Middleware(http.HandlerFunc(
			func(rw http.ResponseWriter, r *http.Request) {
				c.Next()
			})).ServeHTTP(c.Writer, c.Request)
		// We call Abort so that the next handler in the chain is not called, unless we call Next explicitly
		c.Abort()
	})
	server := &http.Server{
		Addr:           fmt.Sprintf(":%v", env.APIServerPort),
		Handler:        router,
		ReadTimeout:    httpServerReadTimeout,
		WriteTimeout:   httpServerWriteTimeout,
		MaxHeaderBytes: 1 << 20,
	}

	initializePublicRoutes(router)
	initializeFileImportServiceRoutes(router)
	initializeAdminRoutes(router)
	initializeAPIRoutes(router)

	// Initialize the server in a goroutine so that it won't block shutdown handling
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			util.Log.Debugw("HTTP server closed", "error", err)
		}
	}()
	util.Log.Debugw("API server started")
	go func() {
		defer services.ShutdownWaitGroup.Done()
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
