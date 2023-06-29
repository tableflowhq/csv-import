package web

import (
	"context"
	"errors"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"net/http"
	"os"
	_ "tableflow/docs"
	"tableflow/go/internal"
	"tableflow/go/pkg/env"
	"tableflow/go/pkg/file"
	"tableflow/go/pkg/routes"
	"tableflow/go/pkg/util"
	"time"
)

//	@title						TableFlow API
//	@version					1.2
//	@description				The backend API of the TableFlow application.
//	@termsOfService				https://tableflow.com/terms
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
	webAppDefaultAuthToken = "tableflow"
)

func InitWebServer(ctx context.Context) error {
	util.Log.Debugw("Starting API server")
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{env.WebAppURL},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders: []string{"Accept", "Authorization", "X-Requested-With", "X-Request-ID",
			"X-HTTP-Method-Override", "Upload-Length", "Upload-Offset", "Tus-Resumable", "Upload-Metadata",
			"Upload-Defer-Length", "Upload-Concat", "User-Agent", "Referrer", "Origin", "Content-Type", "Content-Length",
			"X-Importer-ID", "X-Import-Metadata"},
		ExposeHeaders: []string{"Upload-Offset", "Location", "Upload-Length", "Tus-Version", "Tus-Resumable",
			"Tus-Max-Size", "Tus-Extension", "Upload-Metadata", "Upload-Defer-Length", "Upload-Concat", "Location",
			"Upload-Offset", "Upload-Length"},
		AllowCredentials: true,
		AllowWildcard:    true,
		MaxAge:           12 * time.Hour,
	}))
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	server := &http.Server{
		Addr:           fmt.Sprintf(":%v", env.APIServerPort),
		Handler:        router,
		ReadTimeout:    httpServerReadTimeout,
		WriteTimeout:   httpServerWriteTimeout,
		MaxHeaderBytes: 1 << 20,
	}

	/* ---------------------------  Public routes  --------------------------- */

	public := router.Group("/public")
	// Swagger API docs (accessible at /public/swagger/index.html)
	public.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	// Used for external status health checks (i.e. AWS)
	public.GET("/health", routes.Health)

	/* --------------------------  Importer routes  -------------------------- */

	importer := router.Group("/file-import/v1")
	tusHandler := file.TusFileHandler()
	importer.POST("/files", routes.TusPostFile(tusHandler))
	importer.HEAD("/files/:id", routes.TusHeadFile(tusHandler))
	importer.PATCH("/files/:id", routes.TusPatchFile(tusHandler))

	importer.GET("/importer/:id", routes.GetImporterForImportService)
	importer.GET("/upload/:id", routes.GetUploadForImportService)
	importer.POST("/upload-column-mapping/:id", routes.SetUploadColumnMappingAndImportData)

	/* ---------------------------  Admin routes  ---------------------------- */

	adm := router.Group("/admin/v1")
	authHeaderToken := os.Getenv("TABLEFLOW_WEB_APP_AUTH_TOKEN")
	if len(authHeaderToken) == 0 {
		authHeaderToken = webAppDefaultAuthToken
	}
	adm.Use(util.ApiKeyAuthMiddleware(func(_ *gin.Context, apiKey string) bool {
		return apiKey == authHeaderToken
	}))

	/* Settings */
	adm.GET("/settings/api-key", getAPIKey)
	adm.POST("/settings/api-key", regenerateAPIKey)

	/* Importer */
	adm.POST("/importer", createImporter)
	adm.GET("/importer/:id", getImporter)
	adm.POST("/importer/:id", editImporter)
	adm.GET("/importers", getImporters)

	/* Template */
	adm.GET("/template/:id", getTemplate)
	adm.POST("/template-column", createTemplateColumn)
	adm.DELETE("/template-column/:id", deleteTemplateColumn)

	/* Import */
	adm.GET("/import/:id", getImport)
	adm.GET("/imports", getImports)

	/* Upload */
	adm.GET("/upload/:id", getUpload)

	/* ---------------------------  API routes  --------------------------- */

	api := router.Group("/v1")
	api.Use(util.ApiKeyAuthMiddleware(func(c *gin.Context, apiKey string) bool {
		dbApiKey, err := getAPIKeyFromDB()
		if err != nil || apiKey != dbApiKey {
			return false
		}
		return true
	}))

	/* Import */
	api.GET("/import/:id", getImportForExternalAPI)
	api.GET("/import/:id/download", downloadImportForExternalAPI)

	// Initialize the server in a goroutine so that it won't block shutdown handling
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			util.Log.Debugw("HTTP server closed", "error", err)
		}
	}()
	util.Log.Debugw("API server started")
	go func() {
		defer internal.ShutdownWaitGroup.Done()
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
