package web

import (
	"errors"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/swaggo/files"
	"github.com/swaggo/gin-swagger"
	"net/http"
	"os"
	_ "tableflow/docs"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/util"
	"time"
)

//	@title						TableFlow File Import API
//	@version					1.2
//	@description				The backend file import API of the TableFlow application.
//	@termsOfService				https://tableflow.com/terms
//	@contact.name				TableFlow
//	@contact.url				https://tableflow.com
//	@contact.email				support@tableflow.com
//	@host						localhost:3003
//	@BasePath					/

const httpServerReadTimeout = 120 * time.Second
const httpServerWriteTimeout = 120 * time.Second
const fileImportServerDefaultPort = 3003
const importerUIDefaultURL = "http://localhost:3001"

func StartFileImportServer() *http.Server {
	tf.Log.Debugw("Starting file import server")
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()

	importerURL, err := util.ParseBaseURL(os.Getenv("TABLEFLOW_WEB_IMPORTER_URL"))
	if err != nil {
		tf.Log.Warnw(fmt.Sprintf("Invalid TABLEFLOW_WEB_IMPORTER_URL provided, defaulting to %s. "+
			"This should be set on the environment to the URL of where the importer is hosted", importerUIDefaultURL), "error", err)
	}
	importerURL = lo.Ternary(len(importerURL) != 0, importerURL, importerUIDefaultURL)
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{importerURL},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders: []string{"Accept", "Authorization", "X-Requested-With", "X-Request-ID",
			"X-HTTP-Method-Override", "Upload-Length", "Upload-Offset", "Tus-Resumable", "Upload-Metadata",
			"Upload-Defer-Length", "Upload-Concat", "User-Agent", "Referrer", "Origin", "Content-Type", "Content-Length",
			"X-Import-Metadata", "X-Import-SkipHeaderRowSelection", "X-Import-Template", "X-Import-Schemaless"},
		ExposeHeaders: []string{"Upload-Offset", "Location", "Upload-Length", "Tus-Version", "Tus-Resumable",
			"Tus-Max-Size", "Tus-Extension", "Upload-Metadata", "Upload-Defer-Length", "Upload-Concat", "Location",
			"Upload-Offset", "Upload-Length"},
		AllowCredentials: true,
		AllowWildcard:    true,
		MaxAge:           12 * time.Hour,
	}))

	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	port, err := util.ParsePort(os.Getenv("TABLEFLOW_API_SERVER_PORT"))
	if err != nil {
		port = fileImportServerDefaultPort
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

	/* --------------------------  File import routes  -------------------------- */

	importer := router.Group("/file-import/v1")
	tusHandler := tusFileHandler()

	importer.POST("/files", tusPostFile(tusHandler))
	importer.HEAD("/files/:id", tusHeadFile(tusHandler))
	importer.PATCH("/files/:id", tusPatchFile(tusHandler))

	importer.POST("/importer/:id", importerGetImporter)
	importer.GET("/upload/:id", importerGetUpload)
	importer.POST("/upload/:id/set-header-row", importerSetHeaderRow)
	importer.POST("/upload/:id/set-column-mapping", importerSetColumnMapping)
	importer.GET("/import/:id/review", importerReviewImport)
	importer.GET("/import/:id/rows", importerGetImportRows)
	importer.POST("/import/:id/cell/edit", importerEditImportCell)
	importer.POST("/import/:id/submit", importerSubmitImport)

	// Initialize the server in a goroutine so that it won't block shutdown handling
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			tf.Log.Debugw("HTTP server closed", "error", err)
		}
	}()
	tf.Log.Debugw("API server started")
	return server
}
