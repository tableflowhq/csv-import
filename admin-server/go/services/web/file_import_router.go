package web

import (
	"github.com/gin-gonic/gin"
	"github.com/tus/tusd/pkg/filestore"
	"github.com/tus/tusd/pkg/handler"
	"tableflow/go/pkg/util"
	"tableflow/go/services/file"
)

func initializeFileImportServiceRoutes(router *gin.Engine) {

	/* --------------------------  Importer routes  -------------------------- */

	importer := router.Group("/file-import/v1")
	// TODO: These are routes which will be authenticated by API key from the client
	tusHandler := ginTusHandler()
	importer.POST("/files", tusPostFile(tusHandler))
	importer.HEAD("/files/:id", tusHeadFile(tusHandler))
	importer.PATCH("/files/:id", tusPatchFile(tusHandler))
	//public.GET("/files/:id", gin.WrapF(tusHandler.GetFile))

	importer.GET("/importer/:id", getImporterForImportService)
	importer.GET("/upload/:id", getUploadForImportService)
	importer.POST("/upload-column-mapping/:id", setUploadColumnMappingAndImportData)
}

// TODO: Break this out into its own service eventually
func ginTusHandler() *handler.UnroutedHandler {
	store := filestore.FileStore{
		Path: file.TempUploadsDirectory,
	}
	composer := handler.NewStoreComposer()
	store.UseIn(composer)
	fileHandler, err := handler.NewUnroutedHandler(handler.Config{
		BasePath:                "/file-import/v1/files",
		StoreComposer:           composer,
		NotifyCompleteUploads:   true,
		DisableDownload:         true,
		RespectForwardedHeaders: true,
	})
	if err != nil {
		util.Log.Fatalw("Unable to create tus file upload handler", "error", err)
		return nil
	}
	go func() {
		for {
			event := <-fileHandler.CompleteUploads
			util.Log.Infow("File upload to disk completed", "tus_id", event.Upload.ID)
			go file.UploadCompleteHandler(event)
		}
	}()
	return fileHandler
}
