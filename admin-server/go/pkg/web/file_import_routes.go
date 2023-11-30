package web

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/guregu/null"
	"github.com/samber/lo"
	"github.com/tus/tusd/pkg/handler"
	"gorm.io/gorm"
	"net/http"
	"strconv"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/file"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/model/jsonb"
	"tableflow/go/pkg/scylla"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/types"
	"tableflow/go/pkg/util"
)

// tusPostFile
//
//	@Summary		Post file (tus)
//	@Description	Creates a new file upload after validating the length and parsing the metadata
//	@Tags			File Import
//	@Router			/file-import/v1/files [post]
func tusPostFile(h *handler.UnroutedHandler) gin.HandlerFunc {
	return func(c *gin.Context) {
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
//	@Description	Get a single importer
//	@Tags			File Import
//	@Success		200	{object}	types.Importer
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/importer [post]
//	@Param			body	body	map[string]interface{}	false	"Request body"
func importerGetImporter(c *gin.Context) {
	// If schemaless mode is enabled, return an empty template
	schemaless, _ := strconv.ParseBool(c.Query("schemaless"))
	if schemaless {
		importServiceImporter := types.Importer{
			Template: &types.Template{
				TemplateColumns: []*types.TemplateColumn{},
			},
		}
		c.JSON(http.StatusOK, importServiceImporter)
		return
	}

	if c.Request.ContentLength == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No template provided"})
		return
	}

	// Validate and return the template provided on the request
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		tf.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("Invalid template provided: %v", err.Error())})
		return
	}

	requestTemplate, err := types.ConvertRawTemplate(jsonb.FromMap(req), false)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	importServiceImporter := types.Importer{
		Template: requestTemplate,
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

	// Add suggested template column mappings if the HeaderRowIndex has been set
	if upload.HeaderRowIndex.Valid {
		templateColumns := make([]*model.TemplateColumn, 0)
		if importerUpload.Template != nil {
			// If the template exists on the upload, use those template columns for the mapping
			for _, tc := range importerUpload.Template.TemplateColumns {
				templateColumns = append(templateColumns, &model.TemplateColumn{
					ID:                tc.ID,
					Name:              tc.Name,
					Key:               tc.Key,
					Required:          tc.Required,
					DataType:          model.TemplateColumnDataType(tc.DataType),
					Description:       null.NewString(tc.Description, len(tc.Description) != 0),
					SuggestedMappings: tc.SuggestedMappings,
					//Validations:       nil,
				})
			}
		}
		file.AddColumnMappingSuggestions(importerUpload, templateColumns)
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
	if !upload.IsStored {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Upload is not yet stored, please wait until the upload has finished processing"})
		return
	}

	// Validate and set the header row index on the upload
	req := types.UploadHeaderRowSelection{}
	if err = c.ShouldBindJSON(&req); err != nil {
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

	imp, err := db.GetImportByUploadID(id)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.AbortWithStatusJSON(http.StatusOK, types.Res{Err: err.Error()})
		return
	}
	importExists := imp != nil
	if importExists && imp.IsComplete {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Import is already submitted"})
		return
	}

	// If the header row is already set and is being set again to its current value, just return the upload
	if upload.HeaderRowIndex.Valid && index == upload.HeaderRowIndex.Int64 {
		importerUpload, err := types.ConvertUpload(upload, nil)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
			return
		}
		// Add suggested template column mappings
		templateColumns := make([]*model.TemplateColumn, 0)
		if importerUpload.Template != nil {
			// If the template exists on the upload, use those template columns for the mapping
			for _, tc := range importerUpload.Template.TemplateColumns {
				templateColumns = append(templateColumns, &model.TemplateColumn{
					ID:                tc.ID,
					Name:              tc.Name,
					Key:               tc.Key,
					Required:          tc.Required,
					DataType:          model.TemplateColumnDataType(tc.DataType),
					Description:       null.NewString(tc.Description, len(tc.Description) != 0),
					SuggestedMappings: tc.SuggestedMappings,
					//Validations:       nil,
				})
			}
		}
		file.AddColumnMappingSuggestions(importerUpload, templateColumns)

		c.JSON(http.StatusOK, importerUpload)
		return
	}

	// Allow the header row to be set again by deleting the upload columns and corresponding import (if exists)
	if len(upload.UploadColumns) != 0 {
		err = db.DeleteUploadColumns(upload.ID.String())
		if err != nil {
			errStr := "Could not delete upload columns to reselect header row"
			tf.Log.Errorw(errStr, "upload_id", upload.ID, "error", err)
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("%s: %s", errStr, err)})
			return
		}
		if importExists {
			err = db.DeleteImport(imp.ID.String())
			if err != nil {
				errStr := "Could not delete existing import to reselect header row"
				tf.Log.Errorw(errStr, "import_id", imp.ID, "error", err)
				c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("%s: %s", errStr, err)})
				return
			}
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
		tf.Log.Errorw("Could not update upload in database", "error", err, "upload_id", upload.ID)
		c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: err.Error()})
		return
	}

	importerUpload, err := types.ConvertUpload(upload, nil)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	// Add suggested template column mappings
	templateColumns := make([]*model.TemplateColumn, 0)
	if importerUpload.Template != nil {
		// If the template exists on the upload, use those template columns for the mapping
		for _, tc := range importerUpload.Template.TemplateColumns {
			templateColumns = append(templateColumns, &model.TemplateColumn{
				ID:                tc.ID,
				Name:              tc.Name,
				Key:               tc.Key,
				Required:          tc.Required,
				DataType:          model.TemplateColumnDataType(tc.DataType),
				Description:       null.NewString(tc.Description, len(tc.Description) != 0),
				SuggestedMappings: tc.SuggestedMappings,
				//Validations:       nil,
			})
		}
	}
	file.AddColumnMappingSuggestions(importerUpload, templateColumns)

	c.JSON(http.StatusOK, importerUpload)
}

// importerSetColumnMapping
//
//	@Summary		Set upload column mapping and import data
//	@Description	Set the template column IDs for each upload column and trigger the import
//	@Tags			File Import
//	@Success		200	{object}	types.Res
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/upload/{id}/set-column-mapping [post]
//	@Param			id		path	string				true	"Upload ID"
//	@Param			body	body	map[string]string	true	"Request body"
func importerSetColumnMapping(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No upload ID provided"})
		return
	}

	// Non-schemaless: Upload column ID -> Template column ID
	// Schemaless:     Upload column ID -> User-provided key (i.e. first_name) (only from the request, this will be updated to IDs after the template is generated)
	columnMapping := make(map[string]string)
	if err := c.ShouldBindJSON(&columnMapping); err != nil {
		tf.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	if len(columnMapping) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Please select at least one destination column"})
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
	if !upload.IsStored {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Upload is not yet stored, please wait until the upload has finished processing"})
		return
	}
	if !upload.HeaderRowIndex.Valid {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The header row has not been set"})
		return
	}
	imp, err := db.GetImportByUploadID(id)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.AbortWithStatusJSON(http.StatusOK, types.Res{Err: err.Error()})
		return
	}
	importExists := imp != nil
	if importExists && imp.IsComplete {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Import is already submitted"})
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
			tf.Log.Errorw("Could not update upload in database", "error", err, "upload_id", upload.ID)
			c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: err.Error()})
			return
		}

		// Generate a template to be used for the import processing
		template = &model.Template{}
		for _, importColumn := range importServiceTemplate.TemplateColumns {
			templateColumn := &model.TemplateColumn{
				ID:   importColumn.ID,
				Name: importColumn.Name,
				Key:  importColumn.Key,
			}
			template.TemplateColumns = append(template.TemplateColumns, templateColumn)
		}

	} else if upload.Template.Valid {
		// A template was set on the upload (SDK-defined template), use that instead of the importer template
		importServiceTemplate, err := types.ConvertRawTemplate(upload.Template, false)
		if err != nil {
			tf.Log.Warnw("Could not convert upload template to import service template during import", "error", err, "upload_id", upload.ID, "upload_template", upload.Template)
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
			return
		}
		template = &model.Template{}
		for _, importColumn := range importServiceTemplate.TemplateColumns {
			templateColumn := &model.TemplateColumn{
				ID:                importColumn.ID,
				Name:              importColumn.Name,
				Key:               importColumn.Key,
				Required:          importColumn.Required,
				DataType:          model.TemplateColumnDataType(importColumn.DataType),
				Description:       null.NewString(importColumn.Description, len(importColumn.Description) != 0),
				SuggestedMappings: importColumn.SuggestedMappings,
			}
			for _, v := range importColumn.Validations {
				validation, err := model.ParseValidation(v.ValidationID, importColumn.ID.String(), v.Validate, v.Options, v.Message, v.Severity, templateColumn.DataType)
				if err == nil {
					templateColumn.Validations = append(templateColumn.Validations, validation)
				}
			}
			template.TemplateColumns = append(template.TemplateColumns, templateColumn)
		}
	} else {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No template found for import"})
		return
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

	// Note: If the import exists but has not been stored yet, this means the column mapping has been set and the import
	// has not finished processing. This should be allowed if the user is changing the column mapping.

	// The next cases handle the column mapping having already been submitted with either the same or different mapping
	columnsAlreadyMapped := lo.ContainsBy(upload.UploadColumns, func(uc *model.UploadColumn) bool {
		return uc.TemplateColumnID.Valid
	})
	if columnsAlreadyMapped {
		sameColumnMapping := true
		for _, uc := range upload.UploadColumns {
			tcID, ok := columnMapping[uc.ID.String()]

			// Upload column does not have TemplateColumnID but columnMapping has a value
			if !uc.TemplateColumnID.Valid && ok {
				sameColumnMapping = false
				break
			}
			// Upload column has a TemplateColumnID but columnMapping does not have a value
			if uc.TemplateColumnID.Valid && !ok {
				sameColumnMapping = false
				break
			}
			// Both have values but they are different
			if uc.TemplateColumnID.Valid && ok && tcID != uc.TemplateColumnID.String() {
				sameColumnMapping = false
				break
			}
		}
		// If the column mapping already been set and the new column mapping is the same, no action is required
		if sameColumnMapping {
			c.JSON(http.StatusOK, types.Res{Message: "Column mapping unchanged"})
			return
		}

		// At this point we know the new column mapping is different, so the current column mapping needs to be cleared
		// and the import needs to be deleted and re-imported
		err = db.ClearUploadColumnTemplateColumnIDs(upload)
		if err != nil {
			errStr := "Could not clear existing column mapping"
			tf.Log.Errorw(errStr, "upload_id", upload.ID, "error", err)
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("%s: %s", errStr, err)})
			return
		}
		if importExists {
			tf.Log.Infow("Deleting import for changed column mapping", "import_id", imp.ID)
			err = db.DeleteImport(imp.ID.String())
			if err != nil {
				errStr := "Could not delete existing import to update column mapping"
				tf.Log.Errorw(errStr, "import_id", imp.ID, "error", err)
				c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("%s: %s", errStr, err)})
				return
			}
		}
	}

	err = db.SetTemplateColumnIDs(upload, columnMapping)
	if err != nil {
		tf.Log.Errorw("Could not set template column mapping", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "An error occurred updating the column mapping"})
		return
	}

	// Trigger the import where all rows are loaded and validated to be displayed next on the review step
	util.SafeGo(func() {
		file.ImportData(upload, template)
	}, "upload_id", upload.ID)

	c.JSON(http.StatusOK, types.Res{Message: "Import submitted"})
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
		NumRows:            imp.NumRows,
		NumColumns:         imp.NumColumns,
		NumProcessedValues: imp.NumProcessedValues,
		Metadata:           imp.Metadata,
		IsStored:           imp.IsStored,
		HasErrors:          imp.HasErrors(),
		NumErrorRows:       imp.NumErrorRows,
		NumValidRows:       imp.NumValidRows,
		CreatedAt:          imp.CreatedAt,
		UpdatedAt:          imp.UpdatedAt,
	}
	if !imp.IsStored {
		// Don't attempt to retrieve the data in Scylla if it's not stored
		c.JSON(http.StatusOK, importServiceImport)
		return
	}
	if imp.IsComplete {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Import is already submitted"})
		return
	}

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
//	@Param			filter	query	string	false	"Pagination filter"	Enums(all, valid, error)
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

	filter, err := types.ParseImportRowFilterQuery(c)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	imp, err := db.GetImportByUploadIDWithUpload(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusOK, gin.H{})
		return
	}
	if !imp.IsStored {
		// Don't allow the data to be retrieved in Scylla if it's not stored yet
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Import is not yet stored, please wait until the import has finished processing"})
		return
	}
	if imp.IsComplete {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Import is already submitted"})
		return
	}

	if filter == types.ImportRowFilterValid {
		pagination.Total = int(imp.NumValidRows.Int64)
	} else if filter == types.ImportRowFilterError {
		pagination.Total = int(imp.NumErrorRows.Int64)
	} else {
		pagination.Total = int(imp.NumRows.Int64)
	}

	rows := scylla.PaginateImportRows(imp, pagination.Offset, pagination.Limit, filter)
	if len(rows) < pagination.Limit {
		// There are no more rows, set the next offset to 0
		pagination.NextOffset = 0
	} else if len(rows) != 0 {
		pagination.NextOffset = rows[len(rows)-1].Index + 1
	}
	data := &types.ImportData{
		Filter:     &filter,
		Pagination: &pagination,
		Rows:       rows,
	}

	c.JSON(http.StatusOK, data)
}

// importerEditImportCell
//
//	@Summary		Edit a cell in an import
//	@Description	Edit the value in a cell for an import. If the cell contains an error, it will run it through the validation before allowing the edit.
//	@Tags			File Import
//	@Success		200	{object}	types.ImportCellEditResponse
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/import/{id}/cell/edit [post]
//	@Param			id		path	string				true	"Upload ID"
//	@Param			body	body	types.ImportCell	true	"Request body"
func importerEditImportCell(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No upload ID provided"})
		return
	}
	imp, err := db.GetImportByUploadIDWithUpload(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusOK, gin.H{})
		return
	}
	if !imp.IsStored {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Import is not yet stored, please wait until the import has finished processing"})
		return
	}
	if imp.IsComplete {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Import is already submitted"})
		return
	}
	if imp.Upload == nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Import not attached to upload"})
		return
	}

	// Validate the import cell
	req := types.ImportCell{}
	if err = c.ShouldBindJSON(&req); err != nil {
		tf.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	if req.RowIndex == nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Missing required parameter row_index"})
		return
	}
	if req.CellKey == nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Missing required parameter cell_key"})
		return
	}
	if req.CellValue == nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Missing required parameter cell_value"})
		return
	}
	if *req.RowIndex < 0 || *req.RowIndex > int(imp.NumRows.Int64) {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Parameter row_index out of range"})
		return
	}
	if len(*req.CellKey) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Missing parameter cell_key"})
		return
	}

	rowIndex := *req.RowIndex
	cellKey := *req.CellKey
	cellValue := *req.CellValue

	// Retrieve any validations to perform on the cell
	var validations []*model.Validation

	if imp.Upload.Template.Valid {
		// If the upload uses an SDK-defined template, retrieve any validations from the template on the upload
		template, err := types.ConvertRawTemplate(imp.Upload.Template, false)
		if err != nil {
			tf.Log.Errorw("Upload template invalid retrieving validations for cell edit", "upload_id", imp.Upload.ID, "error", err)
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The SDK-defined template is invalid"})
			return
		}
		for _, templateColumn := range template.TemplateColumns {
			if templateColumn.Key != cellKey {
				continue
			}
			for _, v := range templateColumn.Validations {
				validation, err := model.ParseValidation(v.ValidationID, templateColumn.ID.String(), v.Validate, v.Options, v.Message, v.Severity, model.TemplateColumnDataType(templateColumn.DataType))
				if err == nil {
					validations = append(validations, validation)
				}
			}
		}
	} else {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "An error occurred retrieving the validations for this cell: no template found on upload"})
		return
	}

	failedValidations := make([]model.Validation, 0)
	for _, validation := range validations {
		passed, value := validation.Evaluate(cellValue)
		if !passed {
			switch validation.Severity {
			case model.ValidationSeverityError:
				failedValidations = append(failedValidations, *validation)
				continue
			default:
				// TODO: Update this condition once we support warning and info validation severities
				// We'll most likely need to persist the warning or info into where they are stored when this occurs
				// instead of returning an error here.
				c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Unsupported validation severity"})
				return
			}
		} else {
			cellValue = value
		}
	}

	// TODO: Update GetAnyImportRowErrorFirst to take in validations, do some refactoring in the scylla package to make this cleaner
	row, isErrorRow, err := scylla.GetAnyImportRowErrorFirst(imp.ID.String(), rowIndex)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("Could retrieve row to update cell: %s", err)})
		return
	}
	if isErrorRow && len(row.Errors) == 0 {
		// No errors were returned from import_row_errors
		tf.Log.Warnw("No errors returned from import_row_errors during edit", "import_id", imp.ID, "cell_key", cellKey, "row_index", rowIndex)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No error exists for the current row"})
		return
	}

	// Update the row values for the current cell with the new value
	row.Values[cellKey] = cellValue

	// Update the errors map for the current cell with the new validations, or nil if there are no new errors
	if len(failedValidations) != 0 {
		if row.Errors == nil {
			row.Errors = make(map[string][]types.ImportRowError)
		}
		row.Errors[cellKey] = lo.Map(failedValidations, func(v model.Validation, _ int) types.ImportRowError {
			return types.ImportRowError{
				ValidationID: v.ID,
				Validate:     v.Validate,
				Severity:     string(v.Severity),
				Message:      v.Message,
			}
		})
	} else {
		delete(row.Errors, cellKey)
		if len(row.Errors) == 0 {
			row.Errors = nil
		}
	}

	if len(row.Errors) != 0 {
		// Update or insert into the import_row_errors record to add any new errors or remove the error for the current cell

		rawRowErrors := lo.Map(row.Errors[cellKey], func(ire types.ImportRowError, _ int) uint { return ire.ValidationID })
		if len(rawRowErrors) == 0 {
			rawRowErrors = nil
		}
		err = tf.Scylla.Query("update import_row_errors set errors[?] = ?, values = ? where import_id = ? and row_index = ?",
			cellKey, rawRowErrors, row.Values, imp.ID.String(), rowIndex).Exec()
		if err != nil {
			tf.Log.Errorw("Could update import_row_errors during cell edit", "import_id", imp.ID, "cell_key", cellKey, "row_index", rowIndex, "error", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: fmt.Sprintf("Could not update cell: %s", err)})
			return
		}
		if !isErrorRow {
			// Delete the record from import_rows as we went from a valid row to a row with errors
			err = tf.Scylla.Query("delete from import_rows where import_id = ? and row_index = ?", imp.ID.String(), rowIndex).Exec()
			if err != nil {
				tf.Log.Errorw("Could not delete from import_rows during cell edit", "import_id", imp.ID, "cell_key", cellKey, "row_index", rowIndex, "error", err)
				c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: fmt.Sprintf("Could not update cell: %s", err)})
				return
			}
			// Update the aggregate row numbers on the import
			imp.NumValidRows.Int64--
			imp.NumErrorRows.Int64++
			err = tf.DB.Save(imp).Error
			if err != nil {
				tf.Log.Errorw("Could not update import in database", "import_id", imp.ID, "error", err)
				c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: fmt.Sprintf("Could not update cell: %s", err)})
				return
			}
		}
		res := &types.ImportCellEditResponse{
			NumRows:      imp.NumRows,
			NumValidRows: imp.NumValidRows,
			NumErrorRows: imp.NumErrorRows,
			HasErrors:    imp.HasErrors(),
			Row:          row,
		}
		c.JSON(http.StatusOK, res)
		return
	}

	// At this point all errors are resolved or there never was an error
	if isErrorRow {
		// Move the record from import_row_errors to import_rows (the user was editing an error row and all errors are now resolved)
		err = tf.Scylla.Query("insert into import_rows (import_id, row_index, values) values (?, ?, ?)", imp.ID.String(), rowIndex, row.Values).Exec()
		if err != nil {
			tf.Log.Errorw("Could not insert into import_rows during cell edit", "import_id", imp.ID, "cell_key", cellKey, "row_index", rowIndex, "error", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: fmt.Sprintf("Could not update cell: %s", err)})
			return
		}
		err = tf.Scylla.Query("delete from import_row_errors where import_id = ? and row_index = ?", imp.ID.String(), rowIndex).Exec()
		if err != nil {
			tf.Log.Errorw("Could not delete from import_row_errors during cell edit", "import_id", imp.ID, "cell_key", cellKey, "row_index", rowIndex, "error", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: fmt.Sprintf("Could not update cell: %s", err)})
			return
		}

		// Update the aggregate row numbers on the import
		imp.NumValidRows.Int64++
		imp.NumErrorRows.Int64--
		err = tf.DB.Save(imp).Error
		if err != nil {
			tf.Log.Errorw("Could not update import in database", "import_id", imp.ID, "error", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: fmt.Sprintf("Could not update cell: %s", err)})
			return
		}
	} else {
		// Update import_rows (the user was editing a non-error row and the edit was valid)
		err = tf.Scylla.Query("update import_rows set values[?] = ? where import_id = ? and row_index = ?",
			cellKey, cellValue, imp.ID.String(), rowIndex).Exec()
		if err != nil {
			tf.Log.Errorw("Could update import_rows during cell edit", "import_id", imp.ID, "cell_key", cellKey, "row_index", rowIndex, "error", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: fmt.Sprintf("Could not update cell: %s", err)})
			return
		}
	}

	res := &types.ImportCellEditResponse{
		NumRows:      imp.NumRows,
		NumValidRows: imp.NumValidRows,
		NumErrorRows: imp.NumErrorRows,
		HasErrors:    imp.HasErrors(),
		Row:          row,
	}
	c.JSON(http.StatusOK, res)
	return
}

// importerSubmitImport
//
//	@Summary		Submit an import by upload ID
//	@Description	Submit the reviewed import by the upload ID once the data is reviewed and any errors are fixed
//	@Tags			File Import
//	@Success		200	{object}	types.Import
//	@Failure		400	{object}	types.Res
//	@Router			/file-import/v1/import/{id}/submit [post]
//	@Param			id	path	string	true	"Upload ID"
func importerSubmitImport(c *gin.Context, importCompleteHandler func(types.Import, string)) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No upload ID provided"})
		return
	}
	imp, err := db.GetImportByUploadIDWithUpload(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusOK, gin.H{})
		return
	}
	if !imp.IsStored {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Import is not yet stored, please wait until the import has finished processing"})
		return
	}
	if imp.HasErrors() {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "All errors must be resolved before submitting"})
		return
	}
	if imp.IsComplete {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Import is already submitted"})
		return
	}

	imp.IsComplete = true
	err = tf.DB.Save(imp).Error
	if err != nil {
		tf.Log.Errorw("Could not update import in database", "import_id", imp.ID, "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: err.Error()})
		return
	}

	importServiceImport := &types.Import{
		ID:                 imp.ID,
		UploadID:           imp.UploadID,
		NumRows:            imp.NumRows,
		NumColumns:         imp.NumColumns,
		NumProcessedValues: imp.NumProcessedValues,
		Metadata:           imp.Metadata,
		IsStored:           imp.IsStored,
		HasErrors:          imp.HasErrors(),
		NumErrorRows:       imp.NumErrorRows,
		NumValidRows:       imp.NumValidRows,
		CreatedAt:          imp.CreatedAt,
		UpdatedAt:          imp.UpdatedAt,
		Rows:               []types.ImportRowResponse{},
	}
	rows := scylla.RetrieveAllImportRows(imp)
	importServiceImport.Rows = types.ConvertImportRowsResponse(rows, imp)

	if importCompleteHandler != nil {
		util.SafeGo(func() {
			importCompleteHandler(*importServiceImport, imp.WorkspaceID.String())
		}, "import_id", imp.ID)
	}

	c.JSON(http.StatusOK, importServiceImport)
}
