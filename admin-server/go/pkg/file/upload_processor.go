package file

import (
	"fmt"
	"github.com/gocql/gocql"
	"github.com/guregu/null"
	"github.com/tus/tusd/pkg/handler"
	"io"
	"math"
	"os"
	"strings"
	"sync"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/scylla"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/util"
	"time"
)

type uploadProcessResult struct {
	NumRows int
}

var maxColumnLimit = int(math.Min(1000, math.MaxInt16))
var maxRowLimit = 1000 * 1000 * 10 // TODO: Store and configure this on the workspace? But keep a max limit to prevent runaways?

func UploadCompleteHandler(event handler.HookEvent, uploadAdditionalStorageHandler, uploadLimitCheck func(*model.Upload, *os.File) error) {
	uploadFileName := event.Upload.MetaData["filename"]
	uploadFileType := event.Upload.MetaData["filetype"]
	uploadFileExtension := ""
	if idx := strings.LastIndexByte(uploadFileName, '.'); idx >= 0 {
		uploadFileExtension = uploadFileName[1+idx:]
	}

	importerID := event.HTTPRequest.Header.Get("X-Importer-ID")
	if len(importerID) == 0 {
		tf.Log.Errorw("No importer ID found on the request headers during upload complete handling", "tus_id", event.Upload.ID)
		return
	}
	importer, err := db.GetImporterWithoutTemplate(importerID)
	if err != nil {
		tf.Log.Errorw("Could not retrieve importer from database during upload complete handling", "error", err, "tus_id", event.Upload.ID, "importer_id", importerID)
		return
	}
	importMetadataEncodedStr := event.HTTPRequest.Header.Get("X-Import-Metadata")
	importMetadata := model.JSONB{}
	if len(importMetadataEncodedStr) != 0 {
		importMetadataStr, err := util.DecodeBase64(importMetadataEncodedStr)
		if err != nil {
			tf.Log.Warnw("Could not decode base64 import metadata", "error", err, "tus_id", event.Upload.ID, "importer_id", importerID)
		} else {
			importMetadata, err = model.JSONStringToJSONB(importMetadataStr)
			if err != nil {
				tf.Log.Warnw("Could not convert import metadata to json", "error", err, "tus_id", event.Upload.ID, "importer_id", importerID)
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
	err = tf.DB.Create(upload).Error
	if err != nil {
		tf.Log.Errorw("Could not create upload in database", "error", err, "upload_id", upload.ID, "tus_id", upload.TusID)
		return
	}

	file, err := os.Open(fileName)
	if err != nil {
		tf.Log.Errorw("Could not open temp upload file from disk", "error", err, "upload_id", upload.ID)
		saveUploadError(upload, "An error occurred while processing your upload. Please try again.")
		removeUploadFileFromDisk(file, fileName, upload.ID.String())
		return
	}

	if uploadLimitCheck != nil {
		// Check for upload limits on the workspace
		err = uploadLimitCheck(upload, file)
		if err != nil {
			saveUploadError(upload, err.Error())
			removeUploadFileFromDisk(file, fileName, upload.ID.String())
			return
		}
	}
	// Parse the column headers, sample data, and retrieve the row count
	err = processUploadColumns(upload, file)
	if err != nil {
		tf.Log.Errorw("Could not parse upload columns", "error", err, "upload_id", upload.ID)
		saveUploadError(upload, "An error occurred determining the columns in your file. Please check the file and try again.")
		removeUploadFileFromDisk(file, fileName, upload.ID.String())
		return
	}
	if len(upload.UploadColumns) == 0 {
		tf.Log.Warnw("No upload columns found in file", "error", err, "upload_id", upload.ID)
		saveUploadError(upload, "An error occurred determining the columns in your file. Please check the file and try again.")
		removeUploadFileFromDisk(file, fileName, upload.ID.String())
		return
	}

	uploadResult, err := processAndStoreUpload(upload, file)
	if err != nil {
		tf.Log.Errorw("Could not process upload", "error", err, "upload_id", upload.ID)
		saveUploadError(upload, "An error occurred processing your file. Please check the file and try again.")
		removeUploadFileFromDisk(file, fileName, upload.ID.String())
		return
	}

	if uploadResult.NumRows == 0 {
		tf.Log.Debugw("A file was uploaded with no rows or an error occurred during processing", "upload_id", upload.ID)
		saveUploadError(upload, "No rows with data were found in your file, please try again with a different file that has a header row and at least one row of data.")
		removeUploadFileFromDisk(file, fileName, upload.ID.String())
		return
	}

	err = tf.DB.Create(upload.UploadColumns).Error
	if err != nil {
		tf.Log.Errorw("Could not create upload columns in database", "error", err, "upload_id", upload.ID)
		saveUploadError(upload, "An error occurred determining the columns in your file. Please check the file and try again.")
		removeUploadFileFromDisk(file, fileName, upload.ID.String())
		return
	}

	upload.NumColumns = null.IntFrom(int64(len(upload.UploadColumns)))
	fileSize, err := util.GetFileSize(file)
	upload.FileSize = null.NewInt(fileSize, err == nil)
	upload.NumRows = null.IntFrom(int64(uploadResult.NumRows))
	upload.IsStored = true

	err = tf.DB.Save(upload).Error
	if err != nil {
		tf.Log.Errorw("Could not update upload in database", "error", err)
		removeUploadFileFromDisk(file, fileName, upload.ID.String())
		return
	}

	if uploadAdditionalStorageHandler != nil {
		go func(u *model.Upload, f *os.File, fn string) {
			uploadAdditionalStorageHandler(u, f)
			removeUploadFileFromDisk(f, fn, u.ID.String())
			tf.Log.Debugw("Upload complete", "upload_id", u.ID)
		}(upload, file, fileName)
	} else {
		removeUploadFileFromDisk(file, fileName, upload.ID.String())
		tf.Log.Debugw("Upload complete", "upload_id", upload.ID)
	}
}

func processAndStoreUpload(upload *model.Upload, file *os.File) (uploadProcessResult, error) {
	it, err := util.OpenDataFileIterator(file, upload.FileType.String)
	defer it.Close()
	if err != nil {
		return uploadProcessResult{}, err
	}
	// Skip the header row
	_, err = it.GetRow()
	if err != nil {
		return uploadProcessResult{}, err
	}

	numRows := 0
	goroutines := 8
	batchCounter := 0
	batchSize := 0                      // cumulative batch size in bytes
	maxMutationSize := 16 * 1024 * 1024 // 16MB
	safetyMargin := 0.75

	in := make(chan *gocql.Batch, 0)
	var wg sync.WaitGroup
	for i := 0; i < goroutines; i++ {
		go scylla.ProcessBatch(in, &wg)
	}
	b := scylla.NewBatchInserter()
	startTime := time.Now()

	for i := 0; ; i++ {
		if i >= maxRowLimit {
			tf.Log.Warnw("Max rows reached while processing upload", "upload_id", upload.ID, "max_rows", maxRowLimit)
			in <- b
			break
		}
		row, err := it.GetRow()
		if err == io.EOF {
			in <- b // Send in the last batch
			break
		}
		if err != nil {
			// TODO: Handle parse error here and surface it to user. Save parse errors on upload or new table?
			tf.Log.Warnw("Error while parsing data file", "error", err, "upload_id", upload.ID)
			continue
		}

		approxMutationSize := 0
		uploadRow := make(map[int16]string)
		for columnIndex, columnValue := range row {
			if columnIndex >= len(upload.UploadColumns) {
				tf.Log.Warnw("Index out of range for row", "column_index", columnIndex, "row_index", i, "upload_id", upload.ID)
				break
			}
			// TODO: Deal with invalid characters better, determine charsets programmatically? Or just surface these to the user?
			uploadRow[int16(columnIndex)] = strings.ToValidUTF8(columnValue, "")
			approxMutationSize += len(columnValue)
		}

		numRows++
		batchCounter++
		batchSize += approxMutationSize

		b.Query("insert into upload_rows (upload_id, row_index, values) values (?, ?, ?)", upload.ID.String(), i, uploadRow)

		batchSizeApproachingLimit := batchSize > int(float64(maxMutationSize)*safetyMargin)
		if batchSizeApproachingLimit {
			tf.Log.Infow("Sending in batch early due to limit approaching", "upload_id", upload.ID, "batch_size", batchSize, "batch_counter", batchCounter, "num_rows", numRows)
		}
		if batchCounter == scylla.BatchInsertSize || batchSizeApproachingLimit {
			// Send in the batch and start a new one
			in <- b
			b = scylla.NewBatchInserter()
			batchCounter = 0
			batchSize = 0
		}
	}

	close(in)
	wg.Wait()

	tf.Log.Debugw("Upload processing and storage complete", "num_records", numRows, "time_taken", time.Since(startTime))
	return uploadProcessResult{NumRows: numRows}, nil
}

func processUploadColumns(upload *model.Upload, file *os.File) error {
	it, err := util.OpenDataFileIterator(file, upload.FileType.String)
	defer it.Close()
	if err != nil {
		return err
	}
	headerRowProcessed := false
	sampleDataSize := 3 // Don't collect more than sampleDataSize sample data rows

	for i := 0; i < sampleDataSize; i++ {
		row, err := it.GetRow()
		if err == io.EOF {
			break
		}
		if err != nil {
			// TODO: Handle parse error here and surface it to user. Save parse errors on upload or new table?
			tf.Log.Warnw("Error while parsing data file", "error", err, "upload_id", upload.ID)
			continue
		}
		if !headerRowProcessed {
			headerRowProcessed = true
			for columnIndex, v := range row {
				if columnIndex >= maxColumnLimit {
					tf.Log.Warnw("Max column limit reached for row", "column_index", columnIndex, "row_index", i, "upload_id", upload.ID)
					break
				}
				upload.UploadColumns = append(upload.UploadColumns, &model.UploadColumn{
					UploadID:   upload.ID,
					Name:       v,
					Index:      columnIndex,
					SampleData: make([]string, 0),
				})
			}
			continue
		}
		for columnIndex, v := range row {
			if columnIndex >= len(upload.UploadColumns) {
				tf.Log.Warnw("Index out of range for row", "column_index", columnIndex, "row_index", i, "upload_id", upload.ID)
				break
			}
			upload.UploadColumns[columnIndex].SampleData = append(upload.UploadColumns[columnIndex].SampleData, v)
		}
	}
	return nil
}

func saveUploadError(upload *model.Upload, errorStr string) {
	upload.Error = null.StringFrom(errorStr)
	if err := tf.DB.Save(upload).Error; err != nil {
		tf.Log.Errorw("Could not update upload in database", "error", err, "upload_id", upload.ID)
	}
}

func removeUploadFileFromDisk(file *os.File, fileName, uploadID string) {
	defer file.Close()
	err := os.Remove(fileName)
	if err != nil {
		tf.Log.Errorw("Could not delete upload from file system", "error", err, "upload_id", uploadID)
		return
	}
	err = os.Remove(fmt.Sprintf("%s.info", fileName))
	if err != nil {
		tf.Log.Errorw("Could not delete upload info from file system", "error", err, "upload_id", uploadID)
		return
	}
}
