package web

import (
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gocql/gocql"
	"github.com/guregu/null"
	"github.com/lib/pq"
	"github.com/samber/lo"
	"github.com/tus/tusd/pkg/handler"
	"gorm.io/gorm"
	"net/http"
	"net/url"
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
	ID          model.ID `json:"id" swaggertype:"string" example:"a1ed136d-33ce-4b7e-a7a4-8a5ccfe54cd5"`
	Name        string   `json:"name" example:"First Name"`
	Required    bool     `json:"required" example:"false"`
	Description string   `json:"description" example:"The first name"`
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

type ImportServiceImport struct {
	ID                 model.ID          `json:"id" swaggertype:"string" example:"da5554e3-6c87-41b2-9366-5449a2f15b53"`
	UploadID           model.ID          `json:"upload_id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	ImporterID         model.ID          `json:"importer_id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	NumRows            null.Int          `json:"num_rows" swaggertype:"integer" example:"256"`
	NumColumns         null.Int          `json:"num_columns" swaggertype:"integer" example:"8"`
	NumProcessedValues null.Int          `json:"num_processed_values" swaggertype:"integer" example:"128"`
	Metadata           model.JSONB       `json:"metadata"`
	IsStored           bool              `json:"is_stored" example:"false"`
	CreatedAt          model.NullTime    `json:"created_at" swaggertype:"integer" example:"1682366228"`
	Error              null.String       `json:"error,omitempty" swaggerignore:"true"`
	Rows               []types.ImportRow `json:"rows"`
}

type importProcessResult struct {
	NumRows          int
	NumColumns       int
	NumNonEmptyCells int
}

// importServiceMaxNumRowsToPassData If the import has more rows than this value, then don't pass the data back to the
// frontend callback. It must be retrieved from the API.
const importServiceMaxNumRowsForFrontendPassThrough = 25000

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
		tf.Log.Infow("Upload request blocked coming from unauthorized domain", "importer_id", importer.ID, "referer", referer, "allowed_domains", importer.AllowedDomains)
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
		errStr := err.Error()
		if err == gorm.ErrRecordNotFound {
			errStr = "Importer not found. Check the importerId parameter or reach out to support for assistance."
		}
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: errStr})
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
			ID:          tc.ID,
			Name:        tc.Name,
			Required:    tc.Required,
			Description: tc.Description.String,
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
func getUploadForImportService(c *gin.Context) {
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
		IsStored:      upload.IsStored,
		CreatedAt:     upload.CreatedAt,
		UploadColumns: importerUploadColumns,
	}
	c.JSON(http.StatusOK, importerUpload)
}

// getImportForImportService
//
//	@Summary		Get import by upload ID
//	@Description	Get a single import by the upload ID, including the data if the import is complete
//	@Tags			File Import
//	@Success		200	{object}	ImportServiceImport
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/import/{id} [get]
//	@Param			id	path	string	true	"Upload ID"
func getImportForImportService(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No upload ID provided"})
		return
	}
	imp, err := db.GetImportByUploadID(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusOK, gin.H{})
		return
	}
	importerImport := &ImportServiceImport{
		ID:                 imp.ID,
		UploadID:           imp.UploadID,
		ImporterID:         imp.ImporterID,
		NumRows:            imp.NumRows,
		NumColumns:         imp.NumColumns,
		NumProcessedValues: imp.NumProcessedValues,
		Metadata:           imp.Metadata,
		IsStored:           imp.IsStored,
		CreatedAt:          imp.CreatedAt,
		Rows:               []types.ImportRow{},
	}
	if imp.NumRows.Int64 > importServiceMaxNumRowsForFrontendPassThrough {
		importerImport.Error = null.StringFrom(fmt.Sprintf("This import has %v rows which exceeds the max "+
			"allowed number of rows for frontend callback (%v). Use the API to retrieve the data.",
			imp.NumRows.Int64, importServiceMaxNumRowsForFrontendPassThrough))
		c.JSON(http.StatusOK, importerImport)
		return
	}
	if !imp.IsStored {
		// Don't attempt to retrieve the data in Scylla if it's not stored
		c.JSON(http.StatusOK, importerImport)
		return
	}

	importerImport.Rows = scylla.RetrieveAllImportRows(imp)

	c.JSON(http.StatusOK, importerImport)
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
func setUploadColumnMappingAndImportData(c *gin.Context, importCompleteHandler func(*model.Import)) {
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
	go importData(upload, template, importCompleteHandler)

	c.JSON(http.StatusOK, types.Res{Message: "success"})
}

func importData(upload *model.Upload, template *model.Template, importCompleteHandler func(*model.Import)) {
	imp := &model.Import{
		ID:          model.NewID(),
		UploadID:    upload.ID,
		ImporterID:  upload.ImporterID,
		WorkspaceID: upload.WorkspaceID,
		Metadata:    upload.Metadata,
	}
	err := tf.DB.Create(imp).Error
	if err != nil {
		tf.Log.Errorw("Could not create import in database", "error", err, "upload_id", upload.ID)
		return
	}

	importStartTime := time.Now()
	// template column ID -> template column key
	templateRowMap := make(map[string]string)
	for _, tc := range template.TemplateColumns {
		templateRowMap[tc.ID.String()] = tc.Key
	}
	// upload column index -> template column key
	columnKeyMap := make(map[int]string)
	for _, uc := range upload.UploadColumns {
		if key, ok := templateRowMap[uc.TemplateColumnID.String()]; ok {
			columnKeyMap[uc.Index] = key
		}
	}

	importResult, err := processAndStoreImport(columnKeyMap, template, upload, imp)
	if err != nil {
		tf.Log.Errorw("Could not process and store import", "error", err, "import_id", imp.ID)
		return
	}
	tf.Log.Debugw("Import processing and storage complete", "import_id", imp.ID, "time_taken", time.Since(importStartTime))

	imp.IsStored = true
	imp.NumRows = null.IntFrom(int64(importResult.NumRows))
	imp.NumColumns = null.IntFrom(int64(importResult.NumColumns))
	imp.NumProcessedValues = null.IntFrom(int64(importResult.NumNonEmptyCells))

	err = tf.DB.Save(imp).Error
	if err != nil {
		tf.Log.Errorw("Could not update import in database", "error", err, "import_id", imp.ID)
		return
	}

	if importCompleteHandler != nil {
		importCompleteHandler(imp)
	}

	tf.Log.Debugw("Import complete", "import_id", imp.ID)
}

func processAndStoreImport(columnKeyMap map[int]string, template *model.Template, upload *model.Upload, imp *model.Import) (importProcessResult, error) {
	importRowIndex := 0
	numNonEmptyCells := 0
	columnLength := len(template.TemplateColumns)

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

	paginationPageSize := 1000
	for offset := 0; ; offset += paginationPageSize {
		if offset > int(upload.NumRows.Int64) {
			in <- b
			break
		}
		uploadRows := scylla.PaginateUploadRows(upload.ID.String(), offset, paginationPageSize)
		for pageRowIndex := 0; pageRowIndex < len(uploadRows); pageRowIndex++ {
			/*
				1. iterate through the row
				2. get the upload column from the index of the row (map[int] uploadColumn)
				3. now you have the template column key
				4. store to the import row value map
			*/
			approxMutationSize := 0
			importRowValue := make(map[string]string, columnLength)
			for colPos, cellVal := range uploadRows[pageRowIndex] {
				if key, ok := columnKeyMap[colPos]; ok {
					importRowValue[key] = cellVal
					approxMutationSize += len(cellVal)
					if len(strings.TrimSpace(cellVal)) != 0 {
						numNonEmptyCells++
					}
				}
			}
			batchCounter++
			batchSize += approxMutationSize

			b.Query("insert into import_rows (import_id, row_index, values) values (?, ?, ?)", imp.ID.String(), importRowIndex, importRowValue)

			batchSizeApproachingLimit := batchSize > int(float64(maxMutationSize)*safetyMargin)
			if batchSizeApproachingLimit {
				tf.Log.Infow("Sending in batch early due to limit approaching", "import_id", imp.ID, "batch_size", batchSize, "batch_counter", batchCounter)
			}
			if batchCounter == scylla.BatchInsertSize || batchSizeApproachingLimit {
				// Send in the batch and start a new one
				in <- b
				b = scylla.NewBatchInserter()
				batchCounter = 0
				batchSize = 0
			}
			importRowIndex++
		}
	}

	close(in)
	wg.Wait()

	return importProcessResult{
		NumRows:          importRowIndex,
		NumColumns:       columnLength,
		NumNonEmptyCells: numNonEmptyCells,
	}, nil
}
