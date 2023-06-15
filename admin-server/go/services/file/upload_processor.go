package file

import (
	"encoding/csv"
	"fmt"
	"github.com/guregu/null"
	"github.com/tus/tusd/pkg/handler"
	"io"
	"math"
	"os"
	"strings"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/util"
	"tableflow/go/services/s3"
)

func UploadCompleteHandler(event handler.HookEvent) {
	// TODO: Add metadata to TUS request with the template ID
	// TODO: Add endpoint to retrieve file or file data by ID
	// TODO: Have client call uploads endpoint to check processing status

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
	err = db.DB.Create(upload).Error
	if err != nil {
		util.Log.Errorw("Could not create upload in database", "error", err, "upload_id", upload.ID, "tus_id", upload.TusID)
		return
	}

	file, err := os.Open(fileName)
	defer file.Close()
	if err != nil {
		util.Log.Errorw("Could not open temp upload file from disk", "error", err, "upload_id", upload.ID)
		removeUploadFileFromDisk(fileName, upload.ID.String())
		return
	}

	// Parse the column headers and sample data
	err = createUploadColumns(upload, file)
	if err != nil {
		util.Log.Errorw("Could not parse upload", "error", err, "upload_id", upload.ID)
		removeUploadFileFromDisk(fileName, upload.ID.String())
		return
	}
	upload.IsParsed = true
	fileSize, err := util.GetFileSize(file)
	upload.FileSize = null.NewInt(fileSize, err == nil)
	numRows, err := getCSVRowCount(file)
	if err != nil {
		util.Log.Errorw("Could not get row count for upload", "error", err, "upload_id", upload.ID)
	}
	// Subtract 1 to remove the header row
	upload.NumRows = null.IntFrom(int64(math.Max(float64(numRows-1), 0)))
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

func createUploadColumns(upload *model.Upload, file *os.File) error {
	uploadColumns, err := getCSVUploadColumns(upload, file)
	if err != nil {
		util.Log.Errorw("Could not parse CSV upload columns")
		return err
	}
	upload.NumColumns = null.IntFrom(int64(len(uploadColumns)))
	err = db.DB.Create(&uploadColumns).Error
	if err != nil {
		util.Log.Errorw("Could not create upload columns in database")
		return err
	}
	return nil
}

func getCSVRowCount(file *os.File) (int, error) {
	r := csv.NewReader(file)
	defer func(f *os.File) {
		_, err := f.Seek(0, io.SeekStart)
		if err != nil {
			util.Log.Errorw("Error resetting file reader", "error", err)
		}
	}(file)
	rowCount := 0
	for {
		_, err := r.Read()
		if err != nil {
			if err == io.EOF {
				break
			}
			return 0, err
		}
		rowCount++
	}
	return rowCount, nil
}

func getCSVUploadColumns(upload *model.Upload, file *os.File) ([]model.UploadColumn, error) {
	uploadColumns := make([]model.UploadColumn, 0)
	r := csv.NewReader(file)
	defer func() {
		_, err := file.Seek(0, io.SeekStart)
		if err != nil {
			util.Log.Errorw("Error resetting file reader", "error", err, "upload_id", upload.ID)
		}
	}()

	isHeaderRow := true
	rowIndex := -1
	sampleDataSize := 3
	for {
		rowIndex++
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			// TODO: Handle parse error here and surface it to user. Save parse errors on upload or new table?
			util.Log.Warnw("Error while parsing CSV file", "error", err, "upload_id", upload.ID)
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
		if rowIndex > sampleDataSize {
			// Don't collect more than sampleDataSize sample data rows
			break
		}
		for columnIndex, v := range row {
			if columnIndex >= len(uploadColumns) {
				util.Log.Warnw("Index out of range for row", "index", columnIndex, "value", v, "upload_id", upload.ID)
				continue
			}
			uploadColumns[columnIndex].SampleData = append(uploadColumns[columnIndex].SampleData, v)
		}
	}
	return uploadColumns, nil
}
