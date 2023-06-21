package web

import (
	"fmt"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"io"
	"net/http"
	"strconv"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/util"
	"tableflow/go/services/s3"
)

// getImportForExternalAPI
//
//	@Summary		Get import
//	@Description	Get an individual import
//	@Tags			External API
//	@Success		200	{object}	model.Import
//	@Failure		400	{object}	Res
//	@Router			/v1/import/{id} [get]
//	@Param			id	path	string	true	"Import ID"
func getImportForExternalAPI(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No import ID provided"})
		return
	}
	imp, err := db.GetImport(id)
	if err != nil {
		util.Log.Warnw("Could not get import", "error", err, "import_id", id)
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Could not find import"})
		return
	}
	workspaceID := c.GetString("workspace_id")
	if imp.WorkspaceID.String() != workspaceID {
		util.Log.Warnw("Attempted to download import not belonging to workspace", "workspace_id", workspaceID, "import_id", id)
		c.AbortWithStatusJSON(http.StatusUnauthorized, Res{Err: "Unauthorized"})
		return
	}
	c.JSON(http.StatusOK, imp)
}

// downloadImportForExternalAPI
//
//	@Summary		Download import
//	@Description	Download the import as a file
//	@Tags			External API
//	@Success		200
//	@Failure		400	{object}	Res
//	@Router			/v1/import/{id}/download [get]
//	@Param			id	path	string	true	"Import ID"
func downloadImportForExternalAPI(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No import ID provided"})
		return
	}

	imp, err := db.GetImport(id)
	if err != nil {
		util.Log.Warnw("Could not get import to download", "error", err, "import_id", id)
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "Could not find import"})
		return
	}
	workspaceID := c.GetString("workspace_id")
	if imp.WorkspaceID.String() != workspaceID {
		util.Log.Warnw("Attempted to download import not belonging to workspace", "workspace_id", workspaceID, "import_id", id)
		c.AbortWithStatusJSON(http.StatusUnauthorized, Res{Err: "Unauthorized"})
		return
	}
	if !imp.IsStored {
		c.AbortWithStatusJSON(http.StatusPreconditionFailed, Res{Err: "Import has not finished processing"})
		return
	}

	res, err := s3.S3.DownloadFile(imp.ID.String(), s3.S3.BucketImports)
	if res != nil && res.Body != nil {
		defer res.Body.Close()
	}
	if err != nil {
		util.Log.Errorw("Error downloading file from S3", "error", err, "import_id", id)
		c.AbortWithStatusJSON(http.StatusInternalServerError, Res{Err: "Could not download import"})
		return
	}
	fileExtension := lo.Ternary(imp.FileExtension.Valid, fmt.Sprintf(".%s", imp.FileExtension.String), "")
	fileName := fmt.Sprintf("%s%s", imp.ID.String(), fileExtension)

	// Set the appropriate response headers
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
	c.Header("Content-Type", aws.StringValue(res.ContentType))
	c.Header("Content-Length", strconv.Itoa(int(aws.Int64Value(res.ContentLength))))

	// Stream the file content as the response
	_, err = io.Copy(c.Writer, res.Body)
	if err != nil {
		util.Log.Errorw("Error copying import reader to response during download", "error", err, "import_id", id)
		c.AbortWithStatusJSON(http.StatusInternalServerError, Res{Err: "Could not download import"})
		return
	}
}
