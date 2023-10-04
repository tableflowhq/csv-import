package web

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/guregu/null"
	"gorm.io/gorm"
	"io"
	"net/http"
	"os"
	"strconv"
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

// getImportForExternalAPI
//
//	@Summary		Get import
//	@Description	Get an individual import
//	@Tags			External API
//	@Success		200	{object}	model.Import
//	@Failure		400	{object}	types.Res
//	@Router			/v1/import/{id} [get]
//	@Param			id	path	string	true	"Import ID"
func getImportForExternalAPI(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No import ID provided"})
		return
	}
	imp, err := db.GetCompletedImport(id)
	if err != nil {
		tf.Log.Warnw("Could not get import", "error", err, "import_id", id)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Could not find import"})
		return
	}
	workspaceID := c.GetString("workspace_id")
	if imp.WorkspaceID.String() != workspaceID {
		tf.Log.Warnw("Attempted to download import not belonging to workspace", "workspace_id", workspaceID, "import_id", id)
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: "Unauthorized"})
		return
	}
	c.JSON(http.StatusOK, imp)
}

// getImportRowsForExternalAPI
//
//	@Summary		Get import rows
//	@Description	Paginate the rows of an import
//	@Tags			External API
//	@Success		200	{array}		types.ImportRowResponse
//	@Failure		400	{object}	types.Res
//	@Router			/v1/import/{id}/rows [get]
//	@Param			id		path	string	true	"Import ID"
//	@Param			offset	query	int		false	"Pagination offset"	minimum(0)
//	@Param			limit	query	int		false	"Pagination limit"	minimum(1)	maximum(1000)
func getImportRowsForExternalAPI(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No import ID provided"})
		return
	}

	pagination, err := types.ParsePaginationQuery(c)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	imp, err := db.GetCompletedImport(id)
	if err != nil {
		tf.Log.Warnw("Could not get import to download", "error", err, "import_id", id)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Could not find import"})
		return
	}
	workspaceID := c.GetString("workspace_id")
	if imp.WorkspaceID.String() != workspaceID {
		tf.Log.Warnw("Attempted to download import not belonging to workspace", "workspace_id", workspaceID, "import_id", id)
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: "Unauthorized"})
		return
	}
	if !imp.IsStored {
		c.AbortWithStatusJSON(http.StatusPreconditionFailed, types.Res{Err: "Import has not finished processing"})
		return
	}
	template, err := db.GetTemplateByImporter(imp.ImporterID.String())
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	rows := scylla.PaginateImportRows(imp, pagination.Offset, pagination.Limit, types.ImportRowFilterAll)
	rowsResponse := types.ConvertImportRowsResponse(rows, template.TemplateColumns)

	c.JSON(http.StatusOK, rowsResponse)
}

// downloadImportForExternalAPI
//
//	@Summary		Download import
//	@Description	Download the import as a file
//	@Tags			External API
//	@Success		200
//	@Failure		400	{object}	types.Res
//	@Router			/v1/import/{id}/download [get]
//	@Param			id	path	string	true	"Import ID"
func downloadImportForExternalAPI(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No import ID provided"})
		return
	}

	imp, err := db.GetCompletedImport(id)
	if err != nil {
		tf.Log.Warnw("Could not get import to download", "error", err, "import_id", id)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Could not find import"})
		return
	}
	workspaceID := c.GetString("workspace_id")
	if imp.WorkspaceID.String() != workspaceID {
		tf.Log.Warnw("Attempted to download import not belonging to workspace", "workspace_id", workspaceID, "import_id", id)
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: "Unauthorized"})
		return
	}
	if !imp.IsStored {
		c.AbortWithStatusJSON(http.StatusPreconditionFailed, types.Res{Err: "Import has not finished processing"})
		return
	}
	importDownloadMaxRows := scylla.MaxAllRowRetrieval
	if imp.NumRows.Int64 > int64(importDownloadMaxRows) {
		tf.Log.Warnw("Attempted to download import larger than max allowed", "error", err, "import_id", id, "num_rows", imp.NumRows.Int64, "max_rows", importDownloadMaxRows)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("Imports over %v rows are too large to download directly, please use the /rows pagination endpoint to access the data", importDownloadMaxRows)})
		return
	}

	filePath := fmt.Sprintf("%s/%s", file.TempDownloadsDirectory, imp.ID.String())
	downloadFile, err := os.Create(filePath)
	if err != nil {
		tf.Log.Errorw("Error creating local file to download for external API", "error", err, "import_id", id)
		c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: "Could not download import"})
		return
	}
	defer func(downloadFile *os.File) {
		fileErr := os.Remove(filePath)
		if fileErr != nil {
			tf.Log.Errorw("Could not delete download from file system", "error", fileErr, "import_id", id)
		}
		_ = downloadFile.Close()
	}(downloadFile)

	sampleImportRow, err := scylla.GetAnyImportRow(imp.ID.String(), 0)
	if err != nil {
		tf.Log.Errorw("Could not retrieve sample import row to download import for external API", "error", err, "import_id", id)
		c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: "Could not download import"})
		return
	}

	columnHeaders := make([]string, len(sampleImportRow.Values), len(sampleImportRow.Values))
	pos := 0
	for columnKey, _ := range sampleImportRow.Values {
		columnHeaders[pos] = columnKey
		pos++
	}

	w := csv.NewWriter(downloadFile)
	if err = w.Write(columnHeaders); err != nil {
		tf.Log.Errorw("Error while writing header row to import file for external API download", "error", err, "import_id", imp.ID)
		c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: "Could not download import"})
		return
	}
	for offset := 0; ; offset += scylla.DefaultPaginationSize {
		if offset > int(imp.NumRows.Int64) {
			break
		}
		importRows := scylla.PaginateImportRows(imp, offset, scylla.DefaultPaginationSize, types.ImportRowFilterAll)
		for pageRowIndex := 0; pageRowIndex < len(importRows); pageRowIndex++ {
			row := make([]string, len(columnHeaders), len(columnHeaders))
			for i, key := range columnHeaders {
				row[i] = importRows[pageRowIndex].Values[key]
			}
			if err = w.Write(row); err != nil {
				tf.Log.Warnw("Error while writing row to import file for external API download", "error", err, "import_id", imp.ID)
			}
		}
	}
	w.Flush()

	// Set the appropriate response headers
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fmt.Sprintf("%s.csv", imp.ID.String())))
	c.Header("Content-Type", "text/csv")
	fileSize, _ := util.GetFileSize(downloadFile)
	c.Header("Content-Length", strconv.Itoa(int(fileSize)))

	// Stream the file to the response writer
	_, err = io.Copy(c.Writer, downloadFile)
	if err != nil {
		tf.Log.Errorw("Error copying import reader to response during download", "error", err, "import_id", id)
		c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: "Could not download import"})
		return
	}
	c.Status(http.StatusOK)
}

// TODO: Update for multi-user support
func getWorkspaceUser(workspaceID string) (string, error) {
	type Res struct {
		UserID string
	}
	var res Res
	err := tf.DB.Raw("select user_id::text from workspace_users where workspace_id = ? limit 1;", model.ParseID(workspaceID)).Scan(&res).Error
	if err != nil {
		return "", err
	}
	if len(res.UserID) == 0 {
		return "", errors.New("error determining user in workspace")
	}
	return res.UserID, nil
}

// createImporterForExternalAPI
//
//	@Summary		Create importer
//	@Description	Create an importer
//	@Tags			External API
//	@Success		200	{object}	types.Importer
//	@Failure		400	{object}	types.Res
//	@Router			/v1/importer [post]
//	@Param			body	body	types.Importer	true	"Request body"
func createImporterForExternalAPI(c *gin.Context) {
	workspaceID := c.GetString("workspace_id")
	userID, err := getWorkspaceUser(workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
		return
	}
	user := model.User{ID: model.ParseID(userID)}

	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		tf.Log.Warnw("Could not read JSON body", "error", err, "workspace_id", workspaceID)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	// Write body back for subsequent middleware or handler
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	bodyJSON, err := jsonb.FromBytes(bodyBytes)
	if err != nil {
		tf.Log.Warnw("Invalid JSON body", "error", err, "workspace_id", workspaceID)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	importerRaw, ok := bodyJSON.AsMap()
	if !ok {
		tf.Log.Warnw("Invalid importer JSON body", "error", err, "workspace_id", workspaceID)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Invalid JSON body"})
		return
	}
	name, _ := importerRaw["name"].(string)
	skipHeaderRowSelection, _ := importerRaw["skip_header_row_selection"].(bool)
	if len(name) == 0 {
		name = "My Importer"
	}
	importer := model.Importer{
		ID:                     model.NewID(),
		WorkspaceID:            model.ParseID(workspaceID),
		Name:                   name,
		SkipHeaderRowSelection: skipHeaderRowSelection,
		CreatedBy:              user.ID,
		UpdatedBy:              user.ID,
	}

	// Parse the template from the request
	templateRaw, _ := importerRaw["template"]
	templateJSON := jsonb.JSONB{
		Data:  templateRaw,
		Valid: templateRaw != nil,
	}
	if !templateJSON.Valid {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Invalid importer: The parameter 'template' is required"})
		return
	}
	templateType, err := types.ConvertRawTemplate(templateJSON, true)
	if err != nil {
		tf.Log.Warnw("Invalid template JSON", "error", err, "workspace_id", workspaceID)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	err = tf.DB.Create(&importer).Error
	if err != nil {
		tf.Log.Errorw("Could not create importer", "error", err, "workspace_id", workspaceID)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	template := model.Template{
		ID:          templateType.ID,
		WorkspaceID: importer.WorkspaceID,
		ImporterID:  importer.ID,
		Name:        "Default Template",
		CreatedBy:   user.ID,
		UpdatedBy:   user.ID,
	}
	err = tf.DB.Create(&template).Error
	if err != nil {
		tf.Log.Errorw("Could not create template for importer", "error", err, "workspace_id", workspaceID)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	// TODO: After validations is released, migrate this to a types function that includes validations
	for _, tc := range templateType.TemplateColumns {
		template.TemplateColumns = append(template.TemplateColumns, &model.TemplateColumn{
			ID:                tc.ID,
			TemplateID:        templateType.ID,
			Name:              tc.Name,
			Key:               tc.Key,
			Required:          tc.Required,
			DataType:          model.TemplateColumnDataType(tc.DataType),
			Description:       null.NewString(tc.Description, len(tc.Description) != 0),
			SuggestedMappings: tc.SuggestedMappings,
			CreatedBy:         user.ID,
			UpdatedBy:         user.ID,
			//Validations:       nil,
		})
	}
	err = tf.DB.Create(template.TemplateColumns).Error
	if err != nil {
		tf.Log.Errorw("Could not create template columns", "error", err, "workspace_id", workspaceID)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	importer.Template = &template

	importerType := types.Importer{
		ID:                     importer.ID,
		Name:                   importer.Name,
		SkipHeaderRowSelection: importer.SkipHeaderRowSelection,
		Template:               templateType,
	}

	c.JSON(http.StatusOK, &importerType)
}

// deleteImporterForExternalAPI
//
//	@Summary		Delete importer
//	@Description	Delete an importer along with all associated objects (template, columns)
//	@Tags			External API
//	@Success		200	{object}	types.Res
//	@Failure		400	{object}	types.Res
//	@Router			/v1/importer/{id} [delete]
//	@Param			id	path	string	true	"Importer ID"
func deleteImporterForExternalAPI(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No importer ID provided"})
		return
	}
	importer, err := db.GetImporter(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	workspaceID := c.GetString("workspace_id")
	if importer.WorkspaceID.String() != workspaceID {
		tf.Log.Warnw("Attempted to delete importer not belonging to workspace", "workspace_id", workspaceID, "import_id", id)
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: "Unauthorized"})
		return
	}
	userID, err := getWorkspaceUser(importer.WorkspaceID.String())
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
		return
	}
	user := model.User{ID: model.ParseID(userID)}
	deletedAt := gorm.DeletedAt{Time: time.Now(), Valid: true}

	importer.DeletedBy = user.ID
	importer.DeletedAt = deletedAt

	if importer.Template != nil {
		importer.Template.DeletedBy = user.ID
		importer.Template.DeletedAt = deletedAt
		for i, _ := range importer.Template.TemplateColumns {
			tc := importer.Template.TemplateColumns[i]
			tc.DeletedBy = user.ID
			tc.DeletedAt = deletedAt

			// Delete any validations attached to the template column
			if len(tc.Validations) != 0 {
				err = tf.DB.Delete(tc.Validations).Error
				if err != nil {
					tf.Log.Errorw("Could not delete template column validations", "error", err, "template_column_id", tc.ID)
					c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
					return
				}
			}
		}
	}

	err = tf.DB.Session(&gorm.Session{FullSaveAssociations: true}).Save(&importer).Error
	if err != nil {
		tf.Log.Errorw("Could not delete importer", "error", err, "workspace_id", importer.WorkspaceID, "importer_id", importer.ID)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	c.JSON(http.StatusOK, types.Res{Message: "success"})
}
