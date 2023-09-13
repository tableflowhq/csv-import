package web

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gocql/gocql"
	"github.com/guregu/null"
	"github.com/samber/lo"
	"github.com/tus/tusd/pkg/handler"
	"gorm.io/gorm"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/file"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/model/jsonb"
	"tableflow/go/pkg/scylla"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/types"
	"tableflow/go/pkg/util"
	"time"
)

type importProcessResult struct {
	NumRows            int
	NumColumns         int
	NumProcessedValues int
	NumErrorRows       int
	NumValidRows       int
}

// importServiceMaxNumRowsToPassData If the import has more rows than this value, then don't pass the data back to the
// frontend callback. It must be retrieved from the API.
var maxNumRowsForFrontendPassThrough = int(math.Min(25000, scylla.MaxAllRowRetrieval))

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
				c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
				return
			}
		}
		h.PostFile(c.Writer, c.Request)
	}
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

// importerGetImporter
//
//	@Summary		Get importer
//	@Description	Get a single importer and its template
//	@Tags			File Import
//	@Success		200	{object}	types.Importer
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/importer/{id} [post]
//	@Param			id		path	string					true	"Importer ID"
//	@Param			body	body	map[string]interface{}	false	"Request body"
func importerGetImporter(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No importer ID provided"})
		return
	}

	// If schemaless mode is enabled, return the importer without an attached template
	schemaless, _ := strconv.ParseBool(c.Query("schemaless"))
	if schemaless {
		importer, err := db.GetImporterWithoutTemplate(id)
		if err != nil {
			errStr := err.Error()
			if errors.Is(err, gorm.ErrRecordNotFound) {
				errStr = "Importer not found. Check the importerId parameter or reach out to support for assistance."
			}
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: errStr})
			return
		}
		if len(importer.AllowedDomains) != 0 {
			if err = validateAllowedDomains(c, importer); err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
				return
			}
		}
		importServiceImporter := types.Importer{
			ID:                     importer.ID,
			Name:                   importer.Name,
			SkipHeaderRowSelection: importer.SkipHeaderRowSelection,
			Template: &types.Template{
				TemplateColumns: []*types.TemplateColumn{},
			},
		}
		c.JSON(http.StatusOK, importServiceImporter)
		return
	}

	// If a template is provided in the request, validate and return that instead of the template attached to the importer
	if c.Request.ContentLength != 0 {
		importer, err := db.GetImporterWithoutTemplate(id)
		if err != nil {
			errStr := err.Error()
			if errors.Is(err, gorm.ErrRecordNotFound) {
				errStr = "Importer not found. Check the importerId parameter or reach out to support for assistance."
			}
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: errStr})
			return
		}
		if len(importer.AllowedDomains) != 0 {
			if err = validateAllowedDomains(c, importer); err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
				return
			}
		}

		var req map[string]interface{}
		if err = c.BindJSON(&req); err != nil {
			tf.Log.Warnw("Could not bind JSON", "error", err)
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("Invalid template provided: %v", err.Error())})
			return
		}
		requestTemplate, err := types.ConvertUploadTemplate(jsonb.FromMap(req), false)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
			return
		}
		importServiceImporter := types.Importer{
			ID:                     importer.ID,
			Name:                   importer.Name,
			SkipHeaderRowSelection: importer.SkipHeaderRowSelection,
			Template:               requestTemplate,
		}
		c.JSON(http.StatusOK, importServiceImporter)
		return
	}

	template, err := db.GetTemplateByImporterWithImporter(id)
	if err != nil {
		errStr := err.Error()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			errStr = "Importer not found. Check the importerId parameter or reach out to support for assistance."
		}
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: errStr})
		return
	}
	if !template.ImporterID.Valid || template.Importer == nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Template not attached to importer"})
		return
	}
	if len(template.Importer.AllowedDomains) != 0 {
		if err = validateAllowedDomains(c, template.Importer); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
			return
		}
	}
	if len(template.TemplateColumns) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No template columns found. Please create at least one template column to use this importer."})
		return
	}

	importerTemplateColumns := make([]*types.TemplateColumn, len(template.TemplateColumns))
	for n, tc := range template.TemplateColumns {
		importerTemplateColumns[n] = &types.TemplateColumn{
			ID:          tc.ID,
			Name:        tc.Name,
			Key:         tc.Key,
			Required:    tc.Required,
			Description: tc.Description.String,
			Validations: lo.Map(tc.Validations, func(v *model.Validation, _ int) *types.Validation {
				return &types.Validation{
					ValidationID: v.ID,
					Type:         v.Type.Name,
					Value:        v.Value,
					Severity:     string(v.Severity),
					Message:      v.Message,
				}
			}),
			SuggestedMappings: tc.SuggestedMappings,
		}
	}
	importerTemplate := &types.Template{
		ID:              template.ID,
		Name:            template.Name,
		TemplateColumns: importerTemplateColumns,
	}
	importServiceImporter := types.Importer{
		ID:                     template.Importer.ID,
		Name:                   template.Importer.Name,
		SkipHeaderRowSelection: template.Importer.SkipHeaderRowSelection,
		Template:               importerTemplate,
	}
	c.JSON(http.StatusOK, importServiceImporter)
}

// importerGetUpload
//
//	@Summary		Get upload by tus ID
//	@Description	Get a single upload by the tus ID provided to the client from the upload
//	@Tags			File Import
//	@Success		200	{object}	types.Upload
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/upload/{id} [get]
//	@Param			id	path	string	true	"tus ID"
func importerGetUpload(c *gin.Context) {
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

	numRowsToPreview := 25
	uploadRows := make([]types.UploadRow, 0, numRowsToPreview)

	if upload.IsStored {
		uploadRowData := scylla.PaginateUploadRows(upload.ID.String(), 0, numRowsToPreview)
		for i, row := range uploadRowData {
			uploadRows = append(uploadRows, types.UploadRow{
				Index:  i,
				Values: row,
			})
		}
	}
	importerUpload, err := types.ConvertUpload(upload, uploadRows)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, importerUpload)
}

// importerSetHeaderRow
//
//	@Summary		Set upload header row
//	@Description	Set the header row index on the upload
//	@Tags			File Import
//	@Success		200	{object}	types.Upload
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/upload/{id}/set-header-row [post]
//	@Param			id		path	string							true	"Upload ID"
//	@Param			body	body	types.UploadHeaderRowSelection	true	"Request body"
func importerSetHeaderRow(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No upload ID provided"})
		return
	}
	upload, err := db.GetUpload(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	// Validate and set the header row index on the upload
	req := types.UploadHeaderRowSelection{}
	if err = c.BindJSON(&req); err != nil {
		tf.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	if req.Index == nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Missing required parameter 'index'"})
		return
	}
	index := int64(*req.Index)
	if index < 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The parameter 'index' must be greater than -1"})
		return
	}
	if index == upload.NumRows.Int64-1 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The header row cannot be set to the last row"})
		return
	}
	if index > upload.NumRows.Int64-1 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The header row cannot be greater than the number of rows in the file"})
		return
	}

	// Allow the header row to be set again if the corresponding import does not exist by deleting the upload columns
	if len(upload.UploadColumns) != 0 {
		importExists, err := db.DoesImportExistByUploadID(upload.ID.String())
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
			return
		}
		if importExists {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The header row cannot be set again since the import is already complete"})
			return
		}
		err = db.DeleteUploadColumns(upload.ID.String())
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("Could not delete upload columns to reselect header row: %v", err.Error())})
			return
		}
		upload.UploadColumns = make([]*model.UploadColumn, 0)
	}

	upload.HeaderRowIndex = null.IntFrom(index)

	// Retrieve row data from Scylla to create the upload columns
	rows := make([][]string, 0, file.UploadColumnSampleDataSize)
	uploadRowData := scylla.PaginateUploadRows(upload.ID.String(), int(index), file.UploadColumnSampleDataSize)
	for _, rowMap := range uploadRowData {
		rows = append(rows, util.MapToKeyOrderedSlice(rowMap))
	}

	err = file.CreateUploadColumns(upload, rows)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "An error occurred determining the columns in your file. Please check the file and try again."})
		return
	}

	err = tf.DB.Save(upload).Error
	if err != nil {
		tf.Log.Errorw("Could not update upload in database", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: err.Error()})
		return
	}

	importerUpload, err := types.ConvertUpload(upload, nil)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, importerUpload)
}

// importerSetColumnMappingAndImport
//
//	@Summary		Set upload column mapping and import data
//	@Description	Set the template column IDs for each upload column and trigger the import. Note: we will eventually have a separate import endpoint once there is a review step in the upload process.
//	@Tags			File Import
//	@Success		200	{object}	types.Res
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/upload/{id}/set-column-mapping [post]
//	@Param			id		path	string				true	"Upload ID"
//	@Param			body	body	map[string]string	true	"Request body"
func importerSetColumnMappingAndImport(c *gin.Context, importCompleteHandler func(*model.Import)) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No upload ID provided"})
		return
	}

	// Non-schemaless: Upload column ID -> Template column ID
	// Schemaless:     Upload column ID -> User-provided key (i.e. first_name) (only from the request, this will be updated to IDs after the template is generated)
	columnMapping := make(map[string]string)
	if err := c.BindJSON(&columnMapping); err != nil {
		tf.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	if len(columnMapping) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No column mapping provided"})
		return
	}
	// Validate all keys and values are not empty
	for k, v := range columnMapping {
		if len(k) == 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The column mapping cannot contain empty keys"})
			return
		}
		if len(v) == 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The column mapping cannot contain empty values"})
			return
		}
	}
	// Validate there are no duplicate template column IDs
	if util.HasDuplicateValues(columnMapping) {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Destination columns must be unique and not contain duplicate values"})
		return
	}

	upload, err := db.GetUpload(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	if !upload.HeaderRowIndex.Valid {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The header row has not been set"})
		return
	}

	var template *model.Template

	// Retrieve or generate the template to be used for import processing
	//
	//  1. If the upload is schemaless, generate the template and save it on the upload
	//  2. If the template is SDK-defined, the upload will have a template saved on it, so use that
	//  3. Else, use the template in the database attached to the importer

	if upload.Schemaless {
		var columns []*types.TemplateColumn
		for v, destKey := range columnMapping {
			if !util.ValidateKey(destKey) {
				c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{
					Err: fmt.Sprintf("The column '%s' is invalid. Desintation columns can only contain letters, numbers, and underscores", destKey),
				})
				return
			}
			tcID := model.NewID()
			columns = append(columns, &types.TemplateColumn{
				ID:   tcID,
				Name: destKey,
				Key:  destKey,
			})
			// Update the column mapping to the newly generated template column key
			columnMapping[v] = tcID.String()
		}
		importServiceTemplate := &types.Template{
			ID:              model.NewID(),
			TemplateColumns: columns,
		}
		jsonBytes, err := json.Marshal(importServiceTemplate)
		if err != nil {
			tf.Log.Errorw("Could not marshal import service template for schemaless import", "upload_id", upload.ID, "error", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: err.Error()})
			return
		}
		upload.Template, err = jsonb.FromBytes(jsonBytes)
		if err != nil {
			tf.Log.Errorw("Could not unmarshal import service template for schemaless import", "upload_id", upload.ID, "error", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: err.Error()})
			return
		}
		err = tf.DB.Save(upload).Error
		if err != nil {
			tf.Log.Errorw("Could not update upload in database", "error", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: err.Error()})
			return
		}

		// Generate a template to be used for the import processing
		template = &model.Template{
			Name:        importServiceTemplate.Name,
			WorkspaceID: upload.WorkspaceID,
		}
		for _, importColumn := range importServiceTemplate.TemplateColumns {
			templateColumn := &model.TemplateColumn{
				ID:          importColumn.ID,
				Name:        importColumn.Name,
				Key:         importColumn.Key,
				Required:    importColumn.Required,
				Description: null.NewString(importColumn.Description, len(importColumn.Description) != 0),
			}
			template.TemplateColumns = append(template.TemplateColumns, templateColumn)
		}

	} else if upload.Template.Valid {
		// A template was set on the upload (SDK-defined template), use that instead of the importer template
		importServiceTemplate, err := types.ConvertUploadTemplate(upload.Template, false)
		if err != nil {
			tf.Log.Warnw("Could not convert upload template to import service template during import", "error", err, "upload_id", upload.ID, "upload_template", upload.Template)
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
			return
		}
		template = &model.Template{
			Name:        importServiceTemplate.Name,
			WorkspaceID: upload.WorkspaceID,
		}
		for _, importColumn := range importServiceTemplate.TemplateColumns {
			templateColumn := &model.TemplateColumn{
				ID:                importColumn.ID,
				Name:              importColumn.Name,
				Key:               importColumn.Key,
				Required:          importColumn.Required,
				Description:       null.NewString(importColumn.Description, len(importColumn.Description) != 0),
				SuggestedMappings: importColumn.SuggestedMappings,
			}
			template.TemplateColumns = append(template.TemplateColumns, templateColumn)
		}
	} else {
		// Use the importer template
		template, err = db.GetTemplateByImporter(upload.ImporterID.String())
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
			return
		}
	}

	// Validate template columns exist
	if len(template.TemplateColumns) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Template does not have columns"})
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

// importerReviewImport
//
//	@Summary		Get import by upload ID for the review screen
//	@Description	Get a single import by the upload ID, including the row data for the first page of the review screen if the import is complete
//	@Tags			File Import
//	@Success		200	{object}	types.Import
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/import/{id}/review [get]
//	@Param			id	path	string	true	"Upload ID"
func importerReviewImport(c *gin.Context) {
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
	importServiceImport := &types.Import{
		ID:                 imp.ID,
		UploadID:           imp.UploadID,
		ImporterID:         imp.ImporterID,
		NumRows:            imp.NumRows,
		NumColumns:         imp.NumColumns,
		NumProcessedValues: imp.NumProcessedValues,
		Metadata:           imp.Metadata,
		IsStored:           imp.IsStored,
		HasErrors:          imp.HasErrors(),
		NumErrorRows:       imp.NumErrorRows,
		NumValidRows:       imp.NumValidRows,
		CreatedAt:          imp.CreatedAt,
		Data: &types.ImportData{
			Pagination: &types.Pagination{},
			Rows:       []types.ImportRow{},
		},
	}
	if !imp.IsStored {
		// Don't attempt to retrieve the data in Scylla if it's not stored
		c.JSON(http.StatusOK, importServiceImport)
		return
	}

	// Retrieve the first 100 rows for the validations screen
	pagination := &types.Pagination{
		Total:  int(imp.NumRows.Int64),
		Offset: types.PaginationDefaultOffset,
		Limit:  types.PaginationDefaultLimit,
	}
	importServiceImport.Data.Pagination = pagination
	importServiceImport.Data.Rows = scylla.PaginateImportRows(imp, pagination.Offset, pagination.Limit)

	c.JSON(http.StatusOK, importServiceImport)
}

// importerGetImportRows
//
//	@Summary		Get import rows by upload ID for the review screen
//	@Description	Paginate import rows by the upload ID of an import
//	@Tags			File Import
//	@Success		200	{object}	types.ImportData
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/import/{id}/rows [get]
//	@Param			id		path	string	true	"Upload ID"
//	@Param			offset	query	int		true	"Pagination offset"	minimum(0)
//	@Param			limit	query	int		true	"Pagination limit"	minimum(1)	maximum(1000)
func importerGetImportRows(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No upload ID provided"})
		return
	}

	pagination, err := types.ParsePaginationQuery(c)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	imp, err := db.GetImportByUploadID(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusOK, gin.H{})
		return
	}
	if !imp.IsStored {
		// Don't allow the data to be retrieved in Scylla if it's not stored yet
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Import is not yet stored, please wait until the import has finished processing"})
		return
	}

	pagination.Total = int(imp.NumRows.Int64)

	rows := scylla.PaginateImportRows(imp, pagination.Offset, pagination.Limit)
	data := &types.ImportData{
		Pagination: &pagination,
		Rows:       rows,
	}

	c.JSON(http.StatusOK, data)
}

// importerGetImport
//
//	@Summary		Get import by upload ID
//	@Description	Get a single import by the upload ID, including the data if the import is complete
//	@Tags			File Import
//	@Success		200	{object}	types.Import
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/import/{id} [get]
//	@Param			id	path	string	true	"Upload ID"
func importerGetImport(c *gin.Context) {
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
	importServiceImport := &types.Import{
		ID:                 imp.ID,
		UploadID:           imp.UploadID,
		ImporterID:         imp.ImporterID,
		NumRows:            imp.NumRows,
		NumColumns:         imp.NumColumns,
		NumProcessedValues: imp.NumProcessedValues,
		Metadata:           imp.Metadata,
		IsStored:           imp.IsStored,
		HasErrors:          imp.HasErrors(),
		NumErrorRows:       imp.NumErrorRows,
		NumValidRows:       imp.NumValidRows,
		CreatedAt:          imp.CreatedAt,
		Rows:               []types.ImportRow{},
	}
	if int(imp.NumRows.Int64) > maxNumRowsForFrontendPassThrough {
		importServiceImport.Error = null.StringFrom(fmt.Sprintf("This import has %v rows which exceeds the max "+
			"allowed number of rows for frontend callback (%v). Use the API to retrieve the data.",
			imp.NumRows.Int64, maxNumRowsForFrontendPassThrough))
		c.JSON(http.StatusOK, importServiceImport)
		return
	}
	if !imp.IsStored {
		// Don't attempt to retrieve the data in Scylla if it's not stored
		c.JSON(http.StatusOK, importServiceImport)
		return
	}

	rows := scylla.RetrieveAllImportRows(imp)
	importServiceImport.Rows = rows

	c.JSON(http.StatusOK, importServiceImport)
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

	importResult, err := processAndStoreImport(template, upload, imp)
	if err != nil {
		tf.Log.Errorw("Could not process and store import", "error", err, "import_id", imp.ID)
		return
	}
	tf.Log.Debugw("Import processing and storage complete", "import_id", imp.ID, "time_taken", time.Since(importStartTime))

	imp.IsStored = true
	imp.NumRows = null.IntFrom(int64(importResult.NumRows))
	imp.NumColumns = null.IntFrom(int64(importResult.NumColumns))
	imp.NumProcessedValues = null.IntFrom(int64(importResult.NumProcessedValues))
	imp.NumErrorRows = null.IntFrom(int64(importResult.NumErrorRows))
	imp.NumValidRows = null.IntFrom(int64(importResult.NumValidRows))

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

func processAndStoreImport(template *model.Template, upload *model.Upload, imp *model.Import) (importProcessResult, error) {
	columnKeyMap := generateColumnKeyMap(template, upload)
	numColumns := len(columnKeyMap)
	importID := imp.ID.String()

	importRowIndex := 0
	numProcessedValues := 0
	numValidRows := 0
	numErrorRows := 0

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

	// Start paginating through the upload rows after the header row
	for offset := int(upload.HeaderRowIndex.Int64) + 1; ; offset += paginationPageSize {
		if offset > int(upload.NumRows.Int64) {
			in <- b
			break
		}
		uploadRows := scylla.PaginateUploadRows(upload.ID.String(), offset, paginationPageSize)

		// Iterate over the upload rows in pages returned from Scylla
		for pageRowIndex := 0; pageRowIndex < len(uploadRows); pageRowIndex++ {
			approxMutationSize := 0

			// uploadRow example:
			// {0: 'Mary', 1: 'Jenkins', 2: 'mary@example.com', 3: '02/22/2020', 4: ''}
			uploadRow := uploadRows[pageRowIndex]

			// importRowValues example:
			// {'first_name': 'Mary', 'last_name': 'Jenkins', 'email': 'mary@example.com'}
			importRowValues := make(map[string]string, numColumns)

			// importRowErrors example (the numbers are the validation ID(s) which did not pass):
			// {'first_name': {4281}, 'email': {4281, 4295}}
			importRowErrors := make(map[string][]uint)

			// Iterate over columnKeyMap, the columns that have mappings set (also included any validations)
			// Rows ending in blank values may not exist in the uploadRow (i.e. excel), but we still want to set empty
			// values for those cells as they are logically empty in the source file
			//
			// columnKeyMap example:
			// {0: 'first_name', 1: 'last_name', 2: 'email'}

			for uploadColumnIndex, key := range columnKeyMap {

				// uploadColumnIndex = 0
				// cellValue         = Mary
				// key = first_name + validations
				// importRowValue    = {'first_name': 'Mary'}

				cellValue := uploadRow[uploadColumnIndex]

				// Perform validations on the cell, if any
				for _, v := range key.Validations {
					passed := v.Validate(cellValue)
					if !passed {
						// Add the validation ID to the slice at the key, or create a new entry if the key doesn't exist
						if _, ok := importRowErrors[key.Key]; ok {
							importRowErrors[key.Key] = append(importRowErrors[key.Key], v.ID)
						} else {
							importRowErrors[key.Key] = []uint{v.ID}
						}
					}
				}

				// Add the cell value and update progress
				importRowValues[key.Key] = cellValue
				approxMutationSize += len(cellValue)
				numProcessedValues++
			}

			batchCounter++
			batchSize += approxMutationSize

			if len(importRowErrors) == 0 {
				numValidRows++
				b.Query("insert into import_rows (import_id, row_index, values) values (?, ?, ?)", importID, importRowIndex, importRowValues)
			} else {
				numErrorRows++
				b.Query("insert into import_row_errors (import_id, row_index, values, errors) values (?, ?, ?, ?)", importID, importRowIndex, importRowValues, importRowErrors)
			}

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
		NumRows:            importRowIndex,
		NumColumns:         numColumns,
		NumProcessedValues: numProcessedValues,
		NumErrorRows:       numErrorRows,
		NumValidRows:       numValidRows,
	}, nil
}

type TemplateColumnKeyValidation struct {
	Key         string
	Validations []model.Validation
}

// generateColumnKeyMap
// For the columns that a user set a mapping for, create a map of the upload column indexes to the template column key
// This is used to store the import data in Scylla by the template column key
func generateColumnKeyMap(template *model.Template, upload *model.Upload) map[int]TemplateColumnKeyValidation {

	// templateRowMap == template column ID -> template column key + validations
	templateRowMap := make(map[string]TemplateColumnKeyValidation)
	for _, tc := range template.TemplateColumns {
		templateRowMap[tc.ID.String()] = TemplateColumnKeyValidation{
			Key:         tc.Key,
			Validations: lo.Map(tc.Validations, func(v *model.Validation, _ int) model.Validation { return *v }),
		}
	}

	// columnKeyMap == upload column index -> template column key + validations
	columnKeyMap := make(map[int]TemplateColumnKeyValidation)
	for _, uc := range upload.UploadColumns {
		if !uc.TemplateColumnID.Valid {
			continue
		}
		if key, ok := templateRowMap[uc.TemplateColumnID.String()]; ok {
			columnKeyMap[uc.Index] = key
		}
	}
	return columnKeyMap
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
