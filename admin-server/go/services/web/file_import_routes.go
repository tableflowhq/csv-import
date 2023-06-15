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
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/util"
	"tableflow/go/services/file"
	"tableflow/go/services/s3"
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
		util.Log.Errorw("Missing or invalid referer header while checking allowed domains during import", "importer_id", importer.ID, "referer", referer)
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
		util.Log.Errorw("Upload request blocked coming from unauthorized domain", "importer_id", importer.ID, "referer", referer, "allowed_domains", importer.AllowedDomains)
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
//	@Failure		400	{object}	Res
//	@Router			/file-import/v1/importer/{id} [get]
//	@Param			id	path	string	true	"Importer ID"
func getImporterForImportService(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No importer ID provided"})
		return
	}
	template, err := db.GetTemplateByImporterWithImporter(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
		return
	}
	if !template.ImporterID.Valid || template.Importer == nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Template not attached to importer"})
		return
	}
	if len(template.TemplateColumns) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No template columns found. Please create at least one template column to use this importer."})
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
//	@Failure		400	{object}	Res
//	@Router			/file-import/v1/upload/{id} [get]
//	@Param			id	path	string	true	"tus ID"
func getUploadForImportService(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No upload tus ID provided"})
		return
	}
	upload, err := db.GetUploadByTusID(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, Res{Err: err.Error()})
		return
	}
	// Check if there are limits on the workspace
	if err = checkWorkspaceLimitsForUpload(upload); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
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

func checkWorkspaceLimitsForUpload(upload *model.Upload) error {
	if !upload.IsParsed {
		// The upload isn't finished processing yet, no limits apply
		return nil
	}
	limit, err := db.GetWorkspaceLimit(upload.WorkspaceID.String())
	if err != nil {
		// Assume no limits? Let the upload happen??
		util.Log.Warnw("Could not find workspace limits during upload", "error", err, "workspace_id", upload.WorkspaceID)
		return nil
	}
	if !upload.NumRows.Valid {
		// This shouldn't happen, but log it if it does
		util.Log.Warnw("Upload does not have num_rows set when determining limits", "error", err, "upload_id", upload.ID)
		return nil
	}
	/* Rows per import limit */
	if limit.RowsPerImport.Valid && upload.NumRows.Int64 > limit.RowsPerImport.Int64 {
		createWorkspaceLimitTrigger(upload, limit, upload.NumRows.Int64, limit.RowsPerImport.Int64, model.WorkspaceLimitTriggerTypeRowsPerImport)
		errStr := fmt.Sprintf("This import is limited to %s rows and your file contains %s rows. Please reduce "+
			"the number of rows and upload the file again or contact support to increase this limit.",
			util.CommaFormat(limit.RowsPerImport.Int64), util.CommaFormat(upload.NumRows.Int64))
		return errors.New(errStr)
	}
	if limit.Files.Valid || limit.Rows.Valid {
		// Only retrieve the usage if there are limits to check
		usage, err := db.GetWorkspaceUsageCurrentMonth(upload.WorkspaceID.String())
		if err != nil {
			// Let the upload happen??
			util.Log.Warnw("Could not determine workspace usage during upload", "error", err, "workspace_id", upload.WorkspaceID)
			return nil
		}
		/* Number of files per month limit */
		if limit.Files.Valid && usage.NumFiles >= limit.Files.Int64 {
			createWorkspaceLimitTrigger(upload, limit, usage.NumFiles, limit.Files.Int64, model.WorkspaceLimitTriggerTypeFiles)
			errStr := fmt.Sprintf("The number of allowed imports has been exceeded for the current " +
				"month. Please contact support to increase this limit.")
			return errors.New(errStr)
		}
		/* Number of rows per month limit */
		if limit.Rows.Valid {
			if usage.NumRows+upload.NumRows.Int64 >= limit.Rows.Int64 {
				createWorkspaceLimitTrigger(upload, limit, usage.NumRows, limit.Rows.Int64, model.WorkspaceLimitTriggerTypeRows)
				errStr := fmt.Sprintf("The number of rows in this upload (%s) will cause the current monthly "+
					"limit to be exceeded. Please reduce the number of rows in your file and try again or contact "+
					"support to increase this limit.", util.CommaFormat(upload.NumRows.Int64))
				return errors.New(errStr)
			} else if usage.NumRows >= limit.Rows.Int64 {
				createWorkspaceLimitTrigger(upload, limit, usage.NumRows, limit.Rows.Int64, model.WorkspaceLimitTriggerTypeRows)
				errStr := fmt.Sprintf("The number of allowed rows has been exceeded for the current " +
					"month. Please contact support to increase this limit.")
				return errors.New(errStr)
			}
		}
	}
	return nil
}

func createWorkspaceLimitTrigger(upload *model.Upload, wl *model.WorkspaceLimit, currentValue, limitValue int64, limitType model.WorkspaceLimitTriggerType) {
	wlt := &model.WorkspaceLimitTrigger{
		WorkspaceID:      upload.WorkspaceID,
		WorkspaceLimitID: wl.ID,
		UploadID:         upload.ID,
		LimitType:        limitType,
		CurrentValue:     currentValue,
		LimitValue:       limitValue,
		Blocked:          true,
	}
	if err := db.DB.Create(wlt).Error; err != nil {
		util.Log.Errorw("Unable to create workspace limit trigger", "error", err, "workspace_id", upload.WorkspaceID, "workspace_limit_id", wl.ID, "upload_id", upload.ID)
	}
}

// setUploadColumnMappingAndImportData
//
//	@Summary		Set upload column mapping and import data
//	@Description	Set the template column IDs for each upload column and trigger the import. Note: we will eventually have a separate import endpoint once there is a review step in the upload process.
//	@Tags			File Import
//	@Success		200	{object}	Res
//	@Failure		400	{object}	Res
//	@Router			/file-import/v1/upload-column-mapping/{id} [post]
//	@Param			id		path	string				true	"Upload ID"
//	@Param			body	body	map[string]string	true	"Request body"
func setUploadColumnMappingAndImportData(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No upload ID provided"})
		return
	}
	// Upload column ID -> Template column ID
	columnMapping := make(map[string]string)
	if err := c.BindJSON(&columnMapping); err != nil {
		util.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
		return
	}

	upload, err := db.GetUpload(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
		return
	}
	template, err := db.GetTemplateByImporter(upload.ImporterID.String())
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
		return
	}
	if len(template.TemplateColumns) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Template does not have columns"})
		return
	}

	// Validate there are no duplicate template column IDs
	if util.HasDuplicateValues(columnMapping) {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Mapping cannot contain duplicate template columns"})
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
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "All required columns must be set"})
		return
	}
	err = db.SetTemplateColumnIDs(upload, columnMapping)
	if err != nil {
		util.Log.Errorw("Could not set template column mapping", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "An error occurred updating the column mapping"})
		return
	}

	// Trigger the import
	// This will be its own endpoint or attached to the review stage once that is implemented
	go importData(upload, template)

	c.JSON(http.StatusOK, Res{Message: "success"})
}

func importData(upload *model.Upload, template *model.Template) {
	// TODO: Figure out a more robust solution here instead of polling for the upload to be complete.
	// Maybe have uploads that are successfully completed and mapped pushed to a queue then have a job that polls from that queue?

	err := waitForUploadToBeStored(upload)
	if err != nil {
		util.Log.Errorw("Unable to import data after waiting on S3 upload completion", "error", err)
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
	err = db.DB.Create(imp).Error
	if err != nil {
		util.Log.Errorw("Could not create import in database", "error", err, "upload_id", upload.ID)
		return
	}

	downloadFileName := fmt.Sprintf("%s/%s", file.TempDownloadsDirectory, upload.ID.String())
	downloadFile, err := os.Create(downloadFileName)
	defer func(downloadFile *os.File) {
		_ = os.Remove(downloadFile.Name())
		_ = downloadFile.Close()
	}(downloadFile)
	if err != nil {
		util.Log.Errorw("Failed to create file to download for import", "error", err, "import_id", imp.ID, "file", downloadFileName)
		return
	}

	importFileName := fmt.Sprintf("%s/%s", file.TempImportsDirectory, imp.ID.String())
	importFile, err := os.Create(importFileName)
	defer func(importFile *os.File) {
		_ = os.Remove(importFile.Name())
		_ = importFile.Close()
	}(importFile)
	if err != nil {
		util.Log.Errorw("Failed to create file for import", "error", err, "import_id", imp.ID, "file", importFileName)
		return
	}

	err = s3.S3.DownloadFileToDisk(upload.ID.String(), s3.S3.BucketUploads, downloadFile)
	if err != nil {
		util.Log.Errorw("Unable to download file", "error", err, "import_id", imp.ID, "file", downloadFileName)
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
	w := csv.NewWriter(importFile)
	r := csv.NewReader(downloadFile)
	isHeaderRow := true
	rowIndex := -1
	numNonEmptyCells := 0
	columnLength := len(template.TemplateColumns)
	for {
		rowIndex++
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			util.Log.Warnw("Error while parsing downloaded CSV file", "error", err, "import_id", imp.ID)
			continue
		}
		if isHeaderRow {
			isHeaderRow = false
			records := make([]string, columnLength, columnLength)
			for i, tc := range template.TemplateColumns {
				records[i] = tc.Key
			}
			if err = w.Write(records); err != nil {
				util.Log.Warnw("Error while writing header row to import file", "error", err, "import_id", imp.ID)
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
			util.Log.Warnw("Error while writing row to import file", "error", err, "import_id", imp.ID)
		}
		if rowIndex%10000 == 0 {
			w.Flush()
		}
	}
	w.Flush()
	_, err = importFile.Seek(0, io.SeekStart)
	if err != nil {
		util.Log.Errorw("Error resetting file reader", "error", err, "import_id", imp.ID)
	}
	util.Log.Debugw("Import processing complete", "import_id", imp.ID, "time", time.Since(importStartTime))

	err = s3.S3.UploadFile(imp.ID.String(), imp.FileType.String, s3.S3.BucketImports, importFile)
	if err != nil {
		util.Log.Errorw("Could not upload import file to S3", "error", err, "import_id", imp.ID)
		return
	}

	imp.StorageBucket = null.StringFrom(s3.S3.BucketImports)
	imp.IsStored = true
	imp.NumRows = null.IntFrom(int64(math.Max(float64(rowIndex-1), 0)))
	imp.NumColumns = null.IntFrom(int64(columnLength))
	imp.NumProcessedValues = null.IntFrom(int64(numNonEmptyCells))
	fileSize, err := util.GetFileSize(importFile)
	imp.FileSize = null.NewInt(fileSize, err == nil)
	err = db.DB.Save(imp).Error
	if err != nil {
		util.Log.Errorw("Could not update import in database", "error", err, "import_id", imp.ID)
		return
	}
	util.Log.Debugw("File import complete", "import_id", imp.ID)
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
			util.Log.Debugw("Waiting to import file until upload completion", "upload_id", uploadID, "file_size_mb", uploadSizeMB)
		}
		wait := waitDelay(attempt)
		if attempt == maxAttempts/4 {
			util.Log.Warnw("Long wait time detected waiting for upload to be stored in S3", "attempts", attempt, "wait_time", wait.String(), "upload_id", uploadID, "file_size_mb", uploadSizeMB)
		}
		if attempt == maxAttempts {
			util.Log.Warnw("Exceeded max attempts waiting for upload to be stored in S3", "attempts", attempt, "wait_time", wait.String(), "upload_id", uploadID, "file_size_mb", uploadSizeMB)
			break
		}
		time.Sleep(wait)
	}
	return errors.New("exceeded max wait attempts checking for upload to be stored")
}
