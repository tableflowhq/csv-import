package web

import (
	"github.com/tus/tusd/pkg/filestore"
	"github.com/tus/tusd/pkg/handler"
	"tableflow/go/pkg/file"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/util"
)

func tusFileHandler() *handler.UnroutedHandler {
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
		tf.Log.Fatalw("Unable to create tus file upload handler", "error", err)
		return nil
	}
	go func() {
		for {
			event := <-fileHandler.CompleteUploads
			tf.Log.Infow("File upload to disk completed", "tus_id", event.Upload.ID)

			util.SafeGo(func() {
				// TODO: Implement a recover function that updates the upload error
				file.UploadCompleteHandler(event)
			}, "tus_id", event.Upload.ID)
		}
	}()
	return fileHandler
}
