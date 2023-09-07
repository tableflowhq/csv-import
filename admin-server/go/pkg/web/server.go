package web

import (
	"errors"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/zap"
	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/swaggo/files"
	"github.com/swaggo/gin-swagger"
	"net/http"
	"os"
	_ "tableflow/docs"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
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

const httpServerReadTimeout = 120 * time.Second
const httpServerWriteTimeout = 120 * time.Second
const webServerDefaultPort = 3003
const adminUIDefaultURL = "http://localhost:3000"
const importerUIDefaultURL = "http://localhost:3001"

type ServerConfig struct {
	Middlewares                    []gin.HandlerFunc
	AdminAPIAuthValidator          gin.HandlerFunc
	ExternalAPIAuthValidator       func(c *gin.Context, apiKey string) bool
	GetWorkspaceUser               func(c *gin.Context, workspaceID string) (string, error)
	GetUserID                      func(c *gin.Context) string
	UploadLimitCheck               func(*model.Upload, *os.File) error
	UploadAdditionalStorageHandler func(*model.Upload, *os.File) error
	ImportCompleteHandler          func(*model.Import)
	AdditionalCORSOrigins          []string
	AdditionalCORSHeaders          []string
	AdditionalImporterRoutes       func(group *gin.RouterGroup)
	AdditionalAdminRoutes          func(group *gin.RouterGroup)
	UseZapLogger                   bool
}

func StartWebServer(config ServerConfig) *http.Server {
	tf.Log.Debugw("Starting API server")
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()

	webAppURL, err := util.ParseBaseURL(os.Getenv("TABLEFLOW_WEB_APP_URL"))
	if err != nil {
		tf.Log.Warnw(fmt.Sprintf("Invalid TABLEFLOW_WEB_APP_URL provided, defaulting to %s. "+
			"This should be set on the environment to the URL of where clients will access the front end web app", adminUIDefaultURL), "error", err)
	}
	importerURL, err := util.ParseBaseURL(os.Getenv("TABLEFLOW_WEB_IMPORTER_URL"))
	if err != nil {
		tf.Log.Warnw(fmt.Sprintf("Invalid TABLEFLOW_WEB_IMPORTER_URL provided, defaulting to %s. "+
			"This should be set on the environment to the URL of where the importer is hosted", importerUIDefaultURL), "error", err)
	}
	webAppURL = lo.Ternary(len(webAppURL) != 0, webAppURL, adminUIDefaultURL)
	importerURL = lo.Ternary(len(importerURL) != 0, importerURL, importerUIDefaultURL)
	router.Use(cors.New(cors.Config{
		AllowOrigins: append([]string{webAppURL, importerURL}, config.AdditionalCORSOrigins...),
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders: append([]string{"Accept", "Authorization", "X-Requested-With", "X-Request-ID",
			"X-HTTP-Method-Override", "Upload-Length", "Upload-Offset", "Tus-Resumable", "Upload-Metadata",
			"Upload-Defer-Length", "Upload-Concat", "User-Agent", "Referrer", "Origin", "Content-Type", "Content-Length",
			"X-Importer-ID", "X-Import-Metadata", "X-Import-SkipHeaderRowSelection", "X-Import-Template", "X-Import-Schemaless"},
			config.AdditionalCORSHeaders...),
		ExposeHeaders: []string{"Upload-Offset", "Location", "Upload-Length", "Tus-Version", "Tus-Resumable",
			"Tus-Max-Size", "Tus-Extension", "Upload-Metadata", "Upload-Defer-Length", "Upload-Concat", "Location",
			"Upload-Offset", "Upload-Length"},
		AllowCredentials: true,
		AllowWildcard:    true,
		MaxAge:           12 * time.Hour,
	}))

	if config.UseZapLogger {
		ginLogger := tf.Log.Desugar()
		router.Use(ginzap.Ginzap(ginLogger, time.RFC3339, true))
		router.Use(ginzap.RecoveryWithZap(ginLogger, true))
	} else {
		router.Use(gin.Logger())
		router.Use(gin.Recovery())
	}
	for _, middleware := range config.Middlewares {
		router.Use(middleware)
	}

	port, err := util.ParsePort(os.Getenv("TABLEFLOW_API_SERVER_PORT"))
	if err != nil {
		port = webServerDefaultPort
	}
	server := &http.Server{
		Addr:           fmt.Sprintf(":%v", port),
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
	public.GET("/health", Health)

	/* --------------------------  Importer routes  -------------------------- */

	importer := router.Group("/file-import/v1")
	tusHandler := tusFileHandler(config.UploadAdditionalStorageHandler, config.UploadLimitCheck)

	importer.POST("/files", tusPostFile(tusHandler))
	importer.HEAD("/files/:id", tusHeadFile(tusHandler))
	importer.PATCH("/files/:id", tusPatchFile(tusHandler))

	importer.POST("/importer/:id", importerGetImporter)
	importer.GET("/upload/:id", importerGetUpload)
	importer.POST("/upload/:id/set-header-row", importerSetHeaderRow)
	importer.POST("/upload/:id/set-column-mapping", func(c *gin.Context) { importerSetColumnMappingAndImport(c, config.ImportCompleteHandler) })
	importer.GET("/import/:id/review", importerReviewImport)
	importer.GET("/import/:id/rows", importerGetImportRows)
	importer.GET("/import/:id", importerGetImport)

	/* Additional Routes */
	if config.AdditionalImporterRoutes != nil {
		config.AdditionalImporterRoutes(importer)
	}

	/* ---------------------------  Admin routes  ---------------------------- */

	adm := router.Group("/admin/v1")
	adm.Use(config.AdminAPIAuthValidator)

	/* Organization */
	adm.GET("/organization-workspaces", func(c *gin.Context) { getOrganizationWorkspaces(c, config.GetUserID) })

	/* Workspace */
	adm.GET("/workspace/:id/api-key", func(c *gin.Context) { getWorkspaceAPIKey(c, config.GetWorkspaceUser) })
	adm.POST("/workspace/:id/api-key", func(c *gin.Context) { regenerateWorkspaceAPIKey(c, config.GetWorkspaceUser) })

	/* Importer */
	adm.POST("/importer", func(c *gin.Context) { createImporter(c, config.GetWorkspaceUser) })
	adm.GET("/importer/:id", func(c *gin.Context) { getImporter(c, config.GetWorkspaceUser) })
	adm.POST("/importer/:id", func(c *gin.Context) { editImporter(c, config.GetWorkspaceUser) })
	adm.DELETE("/importer/:id", func(c *gin.Context) { deleteImporter(c, config.GetWorkspaceUser) })
	adm.GET("/importers/:workspace-id", func(c *gin.Context) { getImporters(c, config.GetWorkspaceUser) })

	/* Template */
	adm.GET("/template/:id", func(c *gin.Context) { getTemplate(c, config.GetWorkspaceUser) })
	adm.POST("/template-column", func(c *gin.Context) { createTemplateColumn(c, config.GetWorkspaceUser) })
	adm.POST("/template-column/:id", func(c *gin.Context) { editTemplateColumn(c, config.GetWorkspaceUser) })
	adm.DELETE("/template-column/:id", func(c *gin.Context) { deleteTemplateColumn(c, config.GetWorkspaceUser) })

	/* Import */
	adm.GET("/import/:id", func(c *gin.Context) { getImport(c, config.GetWorkspaceUser) })
	adm.GET("/imports/:workspace-id", func(c *gin.Context) { getImports(c, config.GetWorkspaceUser) })

	/* Upload */
	adm.GET("/upload/:id", func(c *gin.Context) { getUpload(c, config.GetWorkspaceUser) })

	/* Additional Routes */
	if config.AdditionalAdminRoutes != nil {
		config.AdditionalAdminRoutes(adm)
	}

	/* ---------------------------  API routes  --------------------------- */

	api := router.Group("/v1")
	api.Use(APIKeyAuthMiddleware(config.ExternalAPIAuthValidator))

	/* Import */
	api.GET("/import/:id", getImportForExternalAPI)
	api.GET("/import/:id/rows", getImportRowsForExternalAPI)
	api.GET("/import/:id/download", downloadImportForExternalAPI)

	// Initialize the server in a goroutine so that it won't block shutdown handling
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			tf.Log.Debugw("HTTP server closed", "error", err)
		}
	}()
	tf.Log.Debugw("API server started")
	return server
}
