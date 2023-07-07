package web

import (
	"encoding/csv"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/guregu/null"
	"github.com/lib/pq"
	"github.com/samber/lo"
	"github.com/tus/tusd/pkg/handler"
	"io"
	"math"
	"net/http"
	"net/url"
	"os"
	"strings"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/file"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/types"
	"tableflow/go/pkg/util"
	"time"
)

type ImportServiceImporter struct {
	ID       model.ID               `json:"id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	Name     string                 `json:"name" example:"Test Importer"`
	Template *ImportServiceTemplate `json:"template"`
}

type ImportServiceTemplate struct {
	ID              model.ID                       `json:"id" swaggertype:"string" example:"f0797968-becc-422a-b135-19de1d8c5d46"`
	Name            string                         `json:"name" example:"My Template"`
	TemplateColumns []*ImportServiceTemplateColumn `json:"template_columns"`
}

type ImportServiceTemplateColumn struct {
	ID       model.ID `json:"id" swaggertype:"string" example:"a1ed136d-33ce-4b7e-a7a4-8a5ccfe54cd5"`
	Name     string   `json:"name" example:"Work Email"`
	Required bool     `json:"required" example:"false"`
}

type ImportServiceUpload struct {
	ID            model.ID       `json:"id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	TusID         string         `json:"tus_id" example:"ee715c254ee61855b465ed61be930487"`
	ImporterID    model.ID       `json:"importer_id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	FileName      null.String    `json:"file_name" swaggertype:"string" example:"example.csv"`
	FileType      null.String    `json:"file_type" swaggertype:"string" example:"text/csv"`
	FileExtension null.String    `json:"file_extension" swaggertype:"string" example:"csv"`
	FileSize      null.Int       `json:"file_size" swaggertype:"integer" example:"1024"`
	Metadata      model.JSONB    `json:"metadata" swaggertype:"string" example:"{\"user_id\": 1234}"`
	IsParsed      bool           `json:"is_parsed" example:"false"`
	IsStored      bool           `json:"is_stored" example:"false"`
	CreatedAt     model.NullTime `json:"created_at" swaggertype:"integer" example:"1682366228"`

	UploadColumns []*ImportServiceUploadColumn `json:"upload_columns"`
}

type ImportServiceUploadColumn struct {
	ID         model.ID       `json:"id" swaggertype:"string" example:"3c79e7fd-1018-4a27-8b86-9cee84221cd8"`
	Name       string         `json:"name" example:"Work Email"`
	Index      int            `json:"index" example:"0"`
	SampleData pq.StringArray `json:"sample_data" gorm:"type:text[]" swaggertype:"array,string" example:"test@example.com"`
}

type importToCSVResult struct {
	NumRows          int
	NumColumns       int
	NumNonEmptyCells int
}

// tusPostFile
//
//	@Summary		Post file (tus)
//	@Description	Creates a new file upload after validating the length and parsing the metadata
//	@Tags			File Import
//	@Router			/file-import/v1/files [post]
func tusPostFile(h *handler.UnroutedHandler) gin.HandlerFunc {
	return func(c *gin.Context) {
		importerID := c.Request.Header.Get("X-Importer-ID")
		if len(importerID) == 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, "No importer ID is configured for this importer. Please contact support.")
			return
		}
		importer, err := db.GetImporterWithoutTemplate(importerID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, "Unable to retrieve importer with the provided ID. Please contact support.")
			return
		}
		if len(importer.AllowedDomains) != 0 {
			if err = validateAllowedDomains(c, importer); err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, err.Error())
				return
			}
		}
		h.PostFile(c.Writer, c.Request)
	}
}

func validateAllowedDomains(c *gin.Context, importer *model.Importer) error {
	referer := c.Request.Referer()
	uri, err := url.ParseRequestURI(referer)
	if err != nil || len(uri.Host) == 0 {
		tf.Log.Errorw("Missing or invalid referer header while checking allowed domains during import", "importer_id", importer.ID, "referer", referer)
		return errors.New("Unable to determine upload origin. Please contact support.")
	}
	hostName := uri.Hostname()
	containsAllowedDomain := false
	for _, d := range importer.AllowedDomains {
		if strings.HasSuffix(hostName, strings.ToLower(d)) {
			containsAllowedDomain = true
			break
		}
	}
	if !containsAllowedDomain {
		tf.Log.Errorw("Upload request blocked coming from unauthorized domain", "importer_id", importer.ID, "referer", referer, "allowed_domains", importer.AllowedDomains)
		return errors.New("Uploads are only allowed from authorized domains. Please contact support.")
	}
	return nil
}

// tusHeadFile
//
//	@Summary		Head file (tus)
//	@Description	Returns the length and offset for the HEAD request
//	@Tags			File Import
//	@Router			/file-import/v1/files/{id} [head]
//	@Param			id	path	string	true	"tus file ID"
func tusHeadFile(h *handler.UnroutedHandler) gin.HandlerFunc {
	return func(c *gin.Context) {
		h.HeadFile(c.Writer, c.Request)
	}
}

// tusPatchFile
//
//	@Summary		Patch file (tus)
//	@Description	Adds a chunk to an upload, only allowed if enough space in the upload is left
//	@Tags			File Import
//	@Router			/file-import/v1/files/{id} [patch]
//	@Param			id	path	string	true	"tus file ID"
func tusPatchFile(h *handler.UnroutedHandler) gin.HandlerFunc {
	return func(c *gin.Context) {
		h.PatchFile(c.Writer, c.Request)
	}
}

// getImporterForImportService
//
//	@Summary		Get importer
//	@Description	Get a single importer and its template
//	@Tags			File Import
//	@Success		200	{object}	ImportServiceImporter
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/importer/{id} [get]
//	@Param			id	path	string	true	"Importer ID"
func getImporterForImportService(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No importer ID provided"})
		return
	}
	template, err := db.GetTemplateByImporterWithImporter(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	if !template.ImporterID.Valid || template.Importer == nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Template not attached to importer"})
		return
	}
	if len(template.TemplateColumns) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No template columns found. Please create at least one template column to use this importer."})
		return
	}
	if len(template.Importer.AllowedDomains) != 0 {
		if err = validateAllowedDomains(c, template.Importer); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, err.Error())
			return
		}
	}
	importerTemplateColumns := make([]*ImportServiceTemplateColumn, len(template.TemplateColumns))
	for n, tc := range template.TemplateColumns {
		importerTemplateColumns[n] = &ImportServiceTemplateColumn{
			ID:       tc.ID,
			Name:     tc.Name,
			Required: tc.Required,
		}
	}
	importerTemplate := &ImportServiceTemplate{
		ID:              template.ID,
		Name:            template.Name,
		TemplateColumns: importerTemplateColumns,
	}
	importer := ImportServiceImporter{
		ID:       template.Importer.ID,
		Name:     template.Importer.Name,
		Template: importerTemplate,
	}
	c.JSON(http.StatusOK, importer)
}

// getUploadForImportService
//
//	@Summary		Get upload by tus ID
//	@Description	Get a single upload by the tus ID provided to the client from the upload
//	@Tags			File Import
//	@Success		200	{object}	ImportServiceUpload
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/upload/{id} [get]
//	@Param			id	path	string	true	"tus ID"
func getUploadForImportService(c *gin.Context, limitCheck func(*model.Upload) error) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No upload tus ID provided"})
		return
	}
	upload, err := db.GetUploadByTusID(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusOK, gin.H{})
		return
	}
	if upload.Error.Valid {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: upload.Error.String})
		return
	}
	// Check if there are limits on the workspace
	if err = limitCheck(upload); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	importerUploadColumns := make([]*ImportServiceUploadColumn, len(upload.UploadColumns))
	for n, uc := range upload.UploadColumns {
		importerUploadColumns[n] = &ImportServiceUploadColumn{
			ID:         uc.ID,
			Name:       uc.Name,
			Index:      uc.Index,
			SampleData: uc.SampleData,
		}
	}
	importerUpload := &ImportServiceUpload{
		ID:            upload.ID,
		TusID:         upload.TusID,
		ImporterID:    upload.ImporterID,
		FileName:      upload.FileName,
		FileType:      upload.FileType,
		FileExtension: upload.FileExtension,
		FileSize:      upload.FileSize,
		Metadata:      upload.Metadata,
		IsParsed:      upload.IsParsed,
		IsStored:      upload.IsStored,
		CreatedAt:     upload.CreatedAt,
		UploadColumns: importerUploadColumns,
	}
	c.JSON(http.StatusOK, importerUpload)
}

// setUploadColumnMappingAndImportData
//
//	@Summary		Set upload column mapping and import data
//	@Description	Set the template column IDs for each upload column and trigger the import. Note: we will eventually have a separate import endpoint once there is a review step in the upload process.
//	@Tags			File Import
//	@Success		200	{object}	types.Res
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/upload-column-mapping/{id} [post]
//	@Param			id		path	string				true	"Upload ID"
//	@Param			body	body	map[string]string	true	"Request body"
func setUploadColumnMappingAndImportData(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No upload ID provided"})
		return
	}
	// Upload column ID -> Template column ID
	columnMapping := make(map[string]string)
	if err := c.BindJSON(&columnMapping); err != nil {
		tf.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	upload, err := db.GetUpload(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	template, err := db.GetTemplateByImporter(upload.ImporterID.String())
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	if len(template.TemplateColumns) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Template does not have columns"})
		return
	}

	// Validate there are no duplicate template column IDs
	if util.HasDuplicateValues(columnMapping) {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Mapping cannot contain duplicate template columns"})
		return
	}
	// Validate that all required template column IDs are provided
	providedTemplateColumnIDs := lo.MapEntries(columnMapping, func(k string, v string) (string, interface{}) {
		return v, struct{}{}
	})
	hasAllRequiredColumns := lo.EveryBy(template.TemplateColumns, func(tc *model.TemplateColumn) bool {
		if tc.Required {
			_, has := providedTemplateColumnIDs[tc.ID.String()]
			return has
		}
		return true
	})
	if !hasAllRequiredColumns {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "All required columns must be set"})
		return
	}
	err = db.SetTemplateColumnIDs(upload, columnMapping)
	if err != nil {
		tf.Log.Errorw("Could not set template column mapping", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "An error occurred updating the column mapping"})
		return
	}

	// Trigger the import
	// This will be its own endpoint or attached to the review stage once that is implemented
	go importData(upload, template)

	c.JSON(http.StatusOK, types.Res{Message: "success"})
}

func importData(upload *model.Upload, template *model.Template) {
	// TODO: Figure out a more robust solution here instead of polling for the upload to be complete.
	// Maybe have uploads that are successfully completed and mapped pushed to a queue then have a job that polls from that queue?

	err := waitForUploadToBeStored(upload)
	if err != nil {
		tf.Log.Errorw("Unable to import data after waiting on S3 upload completion", "error", err)
		return
	}

	imp := &model.Import{
		ID:            model.NewID(),
		UploadID:      upload.ID,
		ImporterID:    upload.ImporterID,
		WorkspaceID:   upload.WorkspaceID,
		FileType:      upload.FileType,
		FileExtension: upload.FileExtension,
		Metadata:      upload.Metadata,
	}
	err = tf.DB.Create(imp).Error
	if err != nil {
		tf.Log.Errorw("Could not create import in database", "error", err, "upload_id", upload.ID)
		return
	}

	downloadFileName := fmt.Sprintf("%s/%s", file.TempDownloadsDirectory, upload.ID.String())
	downloadFile, err := os.Create(downloadFileName)
	defer func(downloadFile *os.File) {
		_ = os.Remove(downloadFile.Name())
		_ = downloadFile.Close()
	}(downloadFile)
	if err != nil {
		tf.Log.Errorw("Failed to create file to download for import", "error", err, "import_id", imp.ID, "file", downloadFileName)
		return
	}

	importFileName := fmt.Sprintf("%s/%s", file.TempImportsDirectory, imp.ID.String())
	importFile, err := os.Create(importFileName)
	defer func(importFile *os.File) {
		_ = os.Remove(importFile.Name())
		_ = importFile.Close()
	}(importFile)
	if err != nil {
		tf.Log.Errorw("Failed to create file for import", "error", err, "import_id", imp.ID, "file", importFileName)
		return
	}

	err = tf.S3.DownloadFileToDisk(upload.ID.String(), tf.S3.BucketUploads, downloadFile)
	if err != nil {
		tf.Log.Errorw("Unable to download file", "error", err, "import_id", imp.ID, "file", downloadFileName)
		return
	}

	importStartTime := time.Now()
	// template column ID -> row index within template
	templateRowMap := make(map[string]int)
	for i, tc := range template.TemplateColumns {
		templateRowMap[tc.ID.String()] = i
	}
	// upload column index -> template column index
	columnPositionMap := make(map[int]int)
	for _, uc := range upload.UploadColumns {
		if tci, ok := templateRowMap[uc.TemplateColumnID.String()]; ok {
			columnPositionMap[uc.Index] = tci
		}
	}

	importResult, err := processAndWriteCSV(downloadFile, importFile, columnPositionMap, template, upload, imp)
	if err != nil {
		tf.Log.Errorw("Could not process and write import file", "error", err, "import_id", imp.ID, "file", downloadFileName, "file_type", upload.FileType.String)
		return
	}
	tf.Log.Debugw("Import processing complete", "import_id", imp.ID, "time", time.Since(importStartTime))

	err = tf.S3.UploadFile(imp.ID.String(), imp.FileType.String, tf.S3.BucketImports, importFile)
	if err != nil {
		tf.Log.Errorw("Could not upload import file to S3", "error", err, "import_id", imp.ID)
		return
	}

	imp.StorageBucket = null.StringFrom(tf.S3.BucketImports)
	imp.IsStored = true
	// Subtract 1 to remove the header row
	imp.NumRows = null.IntFrom(int64(math.Max(float64(importResult.NumRows-1), 0)))
	imp.NumColumns = null.IntFrom(int64(importResult.NumColumns))
	imp.NumProcessedValues = null.IntFrom(int64(importResult.NumNonEmptyCells))
	fileSize, err := util.GetFileSize(importFile)
	imp.FileSize = null.NewInt(fileSize, err == nil)

	err = tf.DB.Save(imp).Error
	if err != nil {
		tf.Log.Errorw("Could not update import in database", "error", err, "import_id", imp.ID)
		return
	}
	tf.Log.Debugw("File import complete", "import_id", imp.ID)
}

func processAndWriteCSV(fileToRead, fileToWrite *os.File, columnPositionMap map[int]int, template *model.Template, upload *model.Upload, imp *model.Import) (importToCSVResult, error) {
	it, err := util.OpenDataFileIterator(fileToRead, upload.FileType.String)
	defer it.Close()
	if err != nil {
		return importToCSVResult{}, err
	}
	defer util.ResetFileReader(fileToWrite)

	w := csv.NewWriter(fileToWrite)
	isHeaderRow := true
	rowIndex := 0
	numNonEmptyCells := 0
	columnLength := len(template.TemplateColumns)

	for ; ; rowIndex++ {
		if !it.HasNext() {
			break
		}
		row, err := it.GetRow()
		if err == io.EOF {
			break
		}
		if err != nil {
			tf.Log.Warnw("Error while parsing downloaded file", "error", err, "import_id", imp.ID)
			continue
		}
		if isHeaderRow {
			isHeaderRow = false
			records := make([]string, columnLength, columnLength)
			for i, tc := range template.TemplateColumns {
				records[i] = tc.Key
			}
			if err = w.Write(records); err != nil {
				tf.Log.Warnw("Error while writing header row to import file", "error", err, "import_id", imp.ID)
			}
			continue
		}
		/*
			1. iterate through the row
			2. get the upload column from the index of the row (map[int] uploadColumn)
			3. now you have the template column ID
			4. store the value to an array in its position
		*/
		records := make([]string, columnLength, columnLength)
		for i, v := range row {
			if tci, ok := columnPositionMap[i]; ok {
				records[tci] = v
				if len(strings.TrimSpace(v)) != 0 {
					numNonEmptyCells++
				}
			}
		}
		if err = w.Write(records); err != nil {
			tf.Log.Warnw("Error while writing row to import file", "error", err, "import_id", imp.ID)
		}
		if rowIndex%10000 == 0 {
			w.Flush()
		}
	}
	w.Flush()

	return importToCSVResult{
		NumRows:          rowIndex,
		NumColumns:       columnLength,
		NumNonEmptyCells: numNonEmptyCells,
	}, nil
}

func waitForUploadToBeStored(upload *model.Upload) error {
	uploadID := upload.ID.String()
	uploadSizeMB := upload.FileSize.Int64 / 1000 / 1000
	waitDelay := func(attempt int) time.Duration {
		delay := math.Min(math.Pow(2, float64(attempt))*200, 5000)
		return time.Duration(delay) * time.Millisecond
	}
	maxAttempts := 120
	for attempt := 1; ; attempt++ {
		isStored, err := db.IsUploadStored(uploadID)
		if err != nil {
			return err
		}
		if isStored {
			return nil
		}
		if attempt == 1 {
			tf.Log.Debugw("Waiting to import file until upload completion", "upload_id", uploadID, "file_size_mb", uploadSizeMB)
		}
		wait := waitDelay(attempt)
		if attempt == maxAttempts/4 {
			tf.Log.Warnw("Long wait time detected waiting for upload to be stored in S3", "attempts", attempt, "wait_time", wait.String(), "upload_id", uploadID, "file_size_mb", uploadSizeMB)
		}
		if attempt == maxAttempts {
			tf.Log.Warnw("Exceeded max attempts waiting for upload to be stored in S3", "attempts", attempt, "wait_time", wait.String(), "upload_id", uploadID, "file_size_mb", uploadSizeMB)
			break
		}
		time.Sleep(wait)
	}
	return errors.New("exceeded max wait attempts checking for upload to be stored")
}
