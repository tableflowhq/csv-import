package web

import (
	"encoding/csv"
	"fmt"
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"os"
	"strconv"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/file"
	"tableflow/go/pkg/scylla"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/types"
	"tableflow/go/pkg/util"
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
	imp, err := db.GetImport(id)
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
//	@Success		200	{array}		types.ImportRow
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
	offsetParam, _ := c.GetQuery("offset")
	limitParam, _ := c.GetQuery("limit")
	defaultOffset := 0
	defaultLimit := 100
	maxLimit := 1000
	offset := 0
	limit := 0

	if len(offsetParam) == 0 && len(limitParam) != 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The parameter 'offset' is required when providing a limit"})
		return
	}
	if len(limitParam) == 0 && len(offsetParam) != 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The parameter 'limit' is required when providing a offset"})
		return
	}
	if len(offsetParam) == 0 && len(limitParam) == 0 {
		offset = defaultOffset
		limit = defaultLimit
	} else {
		var err error
		offset, err = strconv.Atoi(offsetParam)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Invalid offset parameter"})
			return
		}
		if offset < 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Offset must be positive"})
			return
		}
		limit, err = strconv.Atoi(limitParam)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Invalid limit parameter"})
			return
		}
		if limit < 1 {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Limit must be greater than 1"})
			return
		}
		if limit > maxLimit {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("Limit cannot be greater than %v", maxLimit)})
			return
		}
	}

	imp, err := db.GetImport(id)
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

	rows := scylla.PaginateImportRows(imp.ID.String(), offset, limit)
	c.JSON(http.StatusOK, rows)
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

	imp, err := db.GetImport(id)
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
	importDownloadMaxRows := 100000
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

	sampleImportRow, err := scylla.GetImportRow(imp.ID.String(), 0)
	if err != nil {
		tf.Log.Errorw("Could not retrieve sample import row to download import  for external API", "error", err, "import_id", id)
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
		importRows := scylla.PaginateImportRows(imp.ID.String(), offset, scylla.DefaultPaginationSize)
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
