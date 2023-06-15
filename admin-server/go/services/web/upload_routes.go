package web

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"tableflow/go/pkg/db"
)

// getUpload
//
//	@Summary		Get upload
//	@Description	Get a single upload
//	@Tags			Upload
//	@Success		200	{object}	model.Upload
//	@Failure		400	{object}	Res
//	@Router			/admin/v1/upload/{id} [get]
//	@Param			id	path	string	true	"Upload ID"
func getUpload(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No upload ID provided"})
		return
	}
	upload, err := db.GetUpload(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
		return
	}
	_, err = validateUserInWorkspace(c, upload.WorkspaceID.String())
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, upload)
}
