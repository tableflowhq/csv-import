package web

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/scylla"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/types"
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
//	@Param			offset	query	int		false	"int valid"	minimum(0)
//	@Param			limit	query	int		false	"int valid"	minimum(1)	maximum(1000)
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

//// downloadImportForExternalAPI
////
////	@Summary		Download import
////	@Description	Download the import as a file
////	@Tags			External API
////	@Success		200
////	@Failure		400	{object}	types.Res
////	@Router			/v1/import/{id}/download [get]
////	@Param			id	path	string	true	"Import ID"
//func downloadImportForExternalAPI(c *gin.Context) {
//	id := c.Param("id")
//	if len(id) == 0 {
//		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No import ID provided"})
//		return
//	}
//
//	imp, err := db.GetImport(id)
//	if err != nil {
//		tf.Log.Warnw("Could not get import to download", "error", err, "import_id", id)
//		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Could not find import"})
//		return
//	}
//	workspaceID := c.GetString("workspace_id")
//	if imp.WorkspaceID.String() != workspaceID {
//		tf.Log.Warnw("Attempted to download import not belonging to workspace", "workspace_id", workspaceID, "import_id", id)
//		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: "Unauthorized"})
//		return
//	}
//	if !imp.IsStored {
//		c.AbortWithStatusJSON(http.StatusPreconditionFailed, types.Res{Err: "Import has not finished processing"})
//		return
//	}
//
//	res, err := tf.S3.DownloadFile(imp.ID.String(), tf.S3.BucketImports)
//	if res != nil && res.Body != nil {
//		defer res.Body.Close()
//	}
//	if err != nil {
//		tf.Log.Errorw("Error downloading file from S3", "error", err, "import_id", id)
//		c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: "Could not download import"})
//		return
//	}
//	fileExtension := lo.Ternary(imp.FileExtension.Valid, fmt.Sprintf(".%s", imp.FileExtension.String), "")
//	fileName := fmt.Sprintf("%s%s", imp.ID.String(), fileExtension)
//
//	// Set the appropriate response headers
//	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
//	c.Header("Content-Type", aws.StringValue(res.ContentType))
//	c.Header("Content-Length", strconv.Itoa(int(aws.Int64Value(res.ContentLength))))
//
//	// Stream the file content as the response
//	_, err = io.Copy(c.Writer, res.Body)
//	if err != nil {
//		tf.Log.Errorw("Error copying import reader to response during download", "error", err, "import_id", id)
//		c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: "Could not download import"})
//		return
//	}
//}
