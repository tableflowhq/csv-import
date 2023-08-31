package file

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gocql/gocql"
	"github.com/guregu/null"
	"github.com/tus/tusd/pkg/handler"
	"io"
	"math"
	"os"
	"strconv"
	"strings"
	"sync"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/scylla"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/types"
	"tableflow/go/pkg/util"
	"time"
)

type uploadProcessResult struct {
	NumRows int
}

var maxColumnLimit = int(math.Min(500, math.MaxInt16))
var maxRowLimit = 1000 * 1000 * 10       // TODO: Store and configure this on the workspace? But keep a max limit to prevent runaways?
const UploadColumnSampleDataSize = 1 + 3 // 1 header row + 3 sample rows

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

	importMetadata, err := getImportMetadata(event.HTTPRequest.Header.Get("X-Import-Metadata"))
	if err != nil {
		tf.Log.Warnw("Could not retrieve import metadata", "error", err, "tus_id", event.Upload.ID, "importer_id", importerID)
	}

	// If a template is provided from the SDK, use that instead of the template on the importer
	uploadTemplate, err := generateUploadTemplate(event.HTTPRequest.Header.Get("X-Import-Template"))
	if err != nil {
		tf.Log.Warnw("Could not generate upload template", "error", err, "tus_id", event.Upload.ID, "importer_id", importerID)
	}

	// Determine if the header row selection step should be skipped, setting the header row to the first row of the file
	// Setting the option in the SDK will override the importer setting
	skipHeaderRowSelection := importer.SkipHeaderRowSelection
	skipHeaderRowSelectionHeader := event.HTTPRequest.Header.Get("X-Import-SkipHeaderRowSelection")
	if len(skipHeaderRowSelectionHeader) != 0 {
		skipHeaderRowSelection, _ = strconv.ParseBool(skipHeaderRowSelectionHeader)
	}

	// Determine if the upload is schemaless, where no template will be used and the user will define the keys to map their file to
	schemaless := false
	schemalessHeader := event.HTTPRequest.Header.Get("X-Import-Schemaless")
	if len(schemalessHeader) != 0 {
		schemaless, _ = strconv.ParseBool(schemalessHeader)
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
		Template:      uploadTemplate,
		Schemaless:    schemaless,
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

	uploadResult, err := processAndStoreUpload(upload, file)
	if err != nil {
		tf.Log.Errorw("Could not process upload", "error", err, "upload_id", upload.ID)
		saveUploadError(upload, "An error occurred processing your file. Please check the file and try again.")
		removeUploadFileFromDisk(file, fileName, upload.ID.String())
		return
	}

	if uploadResult.NumRows == 0 {
		tf.Log.Warnw("A file was uploaded with no rows or an error occurred during processing", "upload_id", upload.ID)
		saveUploadError(upload, "No rows were found in your file, please try again with a different file that has a header row and at least one row of data.")
		removeUploadFileFromDisk(file, fileName, upload.ID.String())
		return
	}
	if uploadResult.NumRows == 1 {
		tf.Log.Warnw("A file was uploaded with no rows or an error occurred during processing", "upload_id", upload.ID)
		saveUploadError(upload, "No rows with data were found in your file, please try again with a different file that has a header row and at least one row of data.")
		removeUploadFileFromDisk(file, fileName, upload.ID.String())
		return
	}

	// If SkipHeaderRowSelection is turned on for the importer, set the upload column header index and return the
	// upload columns with the upload
	if skipHeaderRowSelection {
		upload.HeaderRowIndex = null.IntFrom(0)

		// Parse the column headers and sample data directly from the file
		// TODO: Consider moving this to get the data directly from Scylla to avoid having two methods to do it
		err = processUploadColumnsFromFile(upload, file)
		if err != nil {
			saveUploadError(upload, "An error occurred determining the columns in your file. Please check the file and try again.")
			removeUploadFileFromDisk(file, fileName, upload.ID.String())
			return
		}
	}

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

		numBlankCells := 0
		approxMutationSize := 0
		uploadRow := make(map[int16]string)

		// Note that rows ending in blank values may not be picked up by the iterator (i.e. excel)
		// In this example file the last row will be of length 2:
		//
		// first , last , age
		// sara  , cook , 30
		// john  , chen , 29
		// lisa  , ford ,
		//
		// This means that an uploadRow may not have values set for every column. Using the example above, the
		// uploadRows in Scylla would look like:
		//
		// {0: 'first', 1: 'last', 2: 'age'}
		// {0: 'sara',  1: 'cook', 2: '30'}
		// {0: 'john',  1: 'chen', 2: '30'}
		// {0: 'lisa',  1: 'ford'}

		for columnIndex, cellValue := range row {
			if columnIndex >= maxColumnLimit {
				tf.Log.Warnw("Max column limit reached for row", "column_index", columnIndex, "row_index", i, "upload_id", upload.ID)
				break
			}
			if util.IsBlankUnicode(cellValue) {
				numBlankCells++
			}
			// TODO: Deal with invalid characters better, determine charsets programmatically? Or just surface these to the user?
			uploadRow[int16(columnIndex)] = strings.ToValidUTF8(cellValue, "")
			approxMutationSize += len(cellValue)
		}

		// If all cells are blank in the row, don't process it
		if len(row) == 0 || numBlankCells == len(row) {
			i--
			continue
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

func getImportMetadata(importMetadataEncodedStr string) (model.JSONB, error) {
	importMetadata := model.JSONB{}
	if len(importMetadataEncodedStr) == 0 {
		return importMetadata, nil
	}
	importMetadataStr, err := util.DecodeBase64(importMetadataEncodedStr)
	if err != nil {
		return importMetadata, fmt.Errorf("could not decode base64 import metadata: %v", err.Error())
	}
	importMetadata, err = model.JSONStringToJSONB(importMetadataStr)
	if err != nil {
		return importMetadata, fmt.Errorf("could not convert import metadata to json: %v", err.Error())
	}
	return importMetadata, nil
}

func generateUploadTemplate(uploadTemplateEncodedStr string) (model.JSONB, error) {
	var uploadTemplate model.JSONB = nil

	if len(uploadTemplateEncodedStr) == 0 {
		return nil, nil
	}

	uploadTemplateStr, err := util.DecodeBase64(uploadTemplateEncodedStr)
	if err != nil {
		return nil, fmt.Errorf("could not decode base64 upload template: %v", err.Error())
	}

	uploadTemplate, err = model.JSONStringToJSONB(uploadTemplateStr)
	if err != nil {
		return nil, fmt.Errorf("could not convert upload template to json: %v", err.Error())
	}

	// Convert the JSON to an importer template object to validate it and generate template column IDs
	template, err := types.ConvertUploadTemplate(uploadTemplate, true)
	if err != nil {
		return nil, fmt.Errorf("could not convert upload template: %v", err.Error())
	}

	// Now convert the validated and updated template object back to JSON to be stored on the upload
	jsonBytes, err := json.Marshal(template)
	if err != nil {
		return nil, fmt.Errorf("could not marshal converted upload template: %v", err.Error())
	}

	return model.JSONStringToJSONB(string(jsonBytes))
}

func processUploadColumnsFromFile(upload *model.Upload, file *os.File) error {
	it, err := util.OpenDataFileIterator(file, upload.FileType.String)
	defer it.Close()
	if err != nil {
		return err
	}

	rows := make([][]string, 0, UploadColumnSampleDataSize)

	for i := 0; i < UploadColumnSampleDataSize; i++ {
		row, err := it.GetRow()
		if err == io.EOF {
			break
		}
		if err != nil {
			// TODO: Handle parse error here and surface it to user. Save parse errors on upload or new table?
			tf.Log.Warnw("Error while parsing data file", "error", err, "upload_id", upload.ID)
			continue
		}
		rows = append(rows, row)
	}

	return CreateUploadColumns(upload, rows)
}

// CreateUploadColumns Create UploadColumns on the Upload and set the SampleData from the remaining rows
func CreateUploadColumns(upload *model.Upload, rows [][]string) error {
	headerRowProcessed := false

	for rowIndex, row := range rows {
		if !headerRowProcessed {
			headerRowProcessed = true
			for columnIndex, v := range row {
				if columnIndex >= maxColumnLimit {
					tf.Log.Warnw("Max column limit reached for row", "column_index", columnIndex, "row_index", rowIndex, "upload_id", upload.ID)
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
				tf.Log.Warnw("Index out of range for row", "column_index", columnIndex, "row_index", rowIndex, "upload_id", upload.ID)
				break
			}
			upload.UploadColumns[columnIndex].SampleData = append(upload.UploadColumns[columnIndex].SampleData, v)
		}
	}
	if len(upload.UploadColumns) == 0 {
		tf.Log.Warnw("No upload columns found in file", "upload_id", upload.ID)
		return errors.New("no upload columns found in file")
	}
	err := tf.DB.Create(upload.UploadColumns).Error
	if err != nil {
		tf.Log.Errorw("Could not create upload columns in database", "error", err, "upload_id", upload.ID)
		return err
	}
	upload.NumColumns = null.IntFrom(int64(len(upload.UploadColumns)))
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
