package file

import (
	"fmt"
	"github.com/guregu/null"
	"github.com/tus/tusd/pkg/filestore"
	"github.com/tus/tusd/pkg/handler"
	"io"
	"math"
	"os"
	"strings"
	"tableflow/go/internal/s3"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/util"
)

// TODO: Break this out into its own service eventually
func TusFileHandler() *handler.UnroutedHandler {
	store := filestore.FileStore{
		Path: TempUploadsDirectory,
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
			go uploadCompleteHandler(event)
		}
	}()
	return fileHandler
}

func uploadCompleteHandler(event handler.HookEvent) {
	uploadFileName := event.Upload.MetaData["filename"]
	uploadFileType := event.Upload.MetaData["filetype"]
	uploadFileExtension := ""
	if idx := strings.LastIndexByte(uploadFileName, '.'); idx >= 0 {
		uploadFileExtension = uploadFileName[1+idx:]
	}

	importerID := event.HTTPRequest.Header.Get("X-Importer-ID")
	if len(importerID) == 0 {
		util.Log.Errorw("No importer ID found on the request headers during upload complete handling", "tus_id", event.Upload.ID)
		return
	}
	importer, err := db.GetImporterWithoutTemplate(importerID)
	if err != nil {
		util.Log.Errorw("Could not retrieve importer from database during upload complete handling", "error", err, "tus_id", event.Upload.ID, "importer_id", importerID)
		return
	}
	importMetadataEncodedStr := event.HTTPRequest.Header.Get("X-Import-Metadata")
	importMetadata := model.JSONB{}
	if len(importMetadataEncodedStr) != 0 {
		importMetadataStr, err := util.DecodeBase64(importMetadataEncodedStr)
		if err != nil {
			util.Log.Warnw("Could not decode base64 import metadata", "error", err, "tus_id", event.Upload.ID, "importer_id", importerID)
		} else {
			importMetadata, err = model.JSONStringToJSONB(importMetadataStr)
			if err != nil {
				util.Log.Warnw("Could not convert import metadata to json", "error", err, "tus_id", event.Upload.ID, "importer_id", importerID)
			}
		}
	}
	upload := &model.Upload{
		ID:            model.NewID(),
		TusID:         event.Upload.ID,
		ImporterID:    importer.ID,
		WorkspaceID:   importer.WorkspaceID,
		FileName:      null.NewString(uploadFileName, len(uploadFileName) > 0),
		FileType:      null.NewString(uploadFileType, len(uploadFileType) > 0),
		FileExtension: null.NewString(uploadFileExtension, len(uploadFileExtension) > 0),
		Metadata:      importMetadata,
	}
	fileName := fmt.Sprintf("%s/%s", TempUploadsDirectory, upload.TusID)
	if upload.WorkspaceID.Valid {
		err = db.DB.Create(upload).Error
	} else {
		err = db.DB.Omit(db.OpenModelOmitFields...).Create(upload).Error
	}
	if err != nil {
		util.Log.Errorw("Could not create upload in database", "error", err, "upload_id", upload.ID, "tus_id", upload.TusID)
		return
	}

	file, err := os.Open(fileName)
	defer file.Close()
	if err != nil {
		util.Log.Errorw("Could not open temp upload file from disk", "error", err, "upload_id", upload.ID)
		saveUploadError(upload, "An error occurred while processing your upload. Please try again.")
		removeUploadFileFromDisk(fileName, upload.ID.String())
		return
	}

	// Parse the column headers, sample data, and retrieve the row count
	uploadColumns, rowCount, err := processUploadColumnsAndRowCount(upload, file)
	if err != nil {
		util.Log.Errorw("Could not parse upload columns", "error", err, "upload_id", upload.ID)
		saveUploadError(upload, "An error occurred determining the columns in your file. Please check the file and try again.")
		removeUploadFileFromDisk(fileName, upload.ID.String())
		return
	}
	if rowCount == 0 {
		util.Log.Debugw("A file was uploaded with no rows or an error occurred during processing", "upload_id", upload.ID)
		saveUploadError(upload, "No rows were found in your file, please try again with a different file.")
		removeUploadFileFromDisk(fileName, upload.ID.String())
		return
	}
	if rowCount == 1 {
		util.Log.Debugw("A file was uploaded with only one row", "upload_id", upload.ID)
		saveUploadError(upload, "Only one row was found in your file, please try again with a different file that has a header row and at least one row of data.")
		removeUploadFileFromDisk(fileName, upload.ID.String())
		return
	}
	if len(uploadColumns) == 0 {
		util.Log.Warnw("No upload columns found in file", "error", err, "upload_id", upload.ID)
		saveUploadError(upload, "An error occurred determining the columns in your file. Please check the file and try again.")
		removeUploadFileFromDisk(fileName, upload.ID.String())
		return
	}
	err = db.DB.Create(&uploadColumns).Error
	if err != nil {
		util.Log.Errorw("Could not create upload columns in database", "error", err, "upload_id", upload.ID)
		saveUploadError(upload, "An error occurred determining the columns in your file. Please check the file and try again.")
		removeUploadFileFromDisk(fileName, upload.ID.String())
		return
	}

	upload.NumColumns = null.IntFrom(int64(len(uploadColumns)))
	fileSize, err := util.GetFileSize(file)
	upload.FileSize = null.NewInt(fileSize, err == nil)
	// Subtract 1 to remove the header row
	upload.NumRows = null.IntFrom(int64(math.Max(float64(rowCount-1), 0)))

	upload.IsParsed = true
	err = db.DB.Save(upload).Error
	if err != nil {
		util.Log.Errorw("Could not update upload in database", "error", err)
		removeUploadFileFromDisk(fileName, upload.ID.String())
		return
	}

	// Store the upload on S3
	err = s3.S3.UploadFile(upload.ID.String(), upload.FileType.String, s3.S3.BucketUploads, file)
	if err != nil {
		util.Log.Errorw("Could not upload file to S3", "error", err, "upload_id", upload.ID)
		removeUploadFileFromDisk(fileName, upload.ID.String())
		return
	}
	upload.StorageBucket = null.StringFrom(s3.S3.BucketUploads)
	upload.IsStored = true
	err = db.DB.Save(upload).Error
	if err != nil {
		util.Log.Errorw("Could not update upload in database", "error", err, "upload_id", upload.ID)
		removeUploadFileFromDisk(fileName, upload.ID.String())
		return
	}
	removeUploadFileFromDisk(fileName, upload.ID.String())
	util.Log.Debugw("File upload complete", "upload_id", upload.ID)
}

func processUploadColumnsAndRowCount(upload *model.Upload, file *os.File) ([]model.UploadColumn, int, error) {
	it, err := util.OpenDataFileIterator(file, upload.FileType.String)
	defer it.Close()
	if err != nil {
		return nil, 0, err
	}
	uploadColumns := make([]model.UploadColumn, 0)
	isHeaderRow := true
	rowIndex := 0
	sampleDataSize := 3

	for ; ; rowIndex++ {
		if !it.HasNext() {
			break
		}
		row, err := it.GetRow()
		if err == io.EOF {
			break
		}
		if err != nil {
			// TODO: Handle parse error here and surface it to user. Save parse errors on upload or new table?
			util.Log.Warnw("Error while parsing data file", "error", err, "upload_id", upload.ID)
			continue
		}
		if isHeaderRow {
			isHeaderRow = false
			for columnIndex, v := range row {
				uploadColumns = append(uploadColumns, model.UploadColumn{
					UploadID:   upload.ID,
					Name:       v,
					Index:      columnIndex,
					SampleData: make([]string, 0),
				})
			}
			continue
		}
		if rowIndex <= sampleDataSize {
			// Don't collect more than sampleDataSize sample data rows
			for columnIndex, v := range row {
				if columnIndex >= len(uploadColumns) {
					util.Log.Warnw("Index out of range for row", "index", columnIndex, "value", v, "upload_id", upload.ID)
					continue
				}
				uploadColumns[columnIndex].SampleData = append(uploadColumns[columnIndex].SampleData, v)
			}
		}
		// Continue to iterate through the file to get the row count
	}
	return uploadColumns, rowIndex, nil
}

func saveUploadError(upload *model.Upload, errorStr string) {
	upload.Error = null.StringFrom(errorStr)
	if err := db.DB.Save(upload).Error; err != nil {
		util.Log.Errorw("Could not update upload in database", "error", err, "upload_id", upload.ID)
	}
}

func removeUploadFileFromDisk(fileName, uploadID string) {
	err := os.Remove(fileName)
	if err != nil {
		util.Log.Errorw("Could not delete upload from file system", "error", err, "upload_id", uploadID)
		return
	}
	err = os.Remove(fmt.Sprintf("%s.info", fileName))
	if err != nil {
		util.Log.Errorw("Could not delete upload info from file system", "error", err, "upload_id", uploadID)
		return
	}
}
