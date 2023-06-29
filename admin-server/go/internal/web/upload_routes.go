package web

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/types"
)

// getUpload
//
//	@Summary		Get upload
//	@Description	Get a single upload
//	@Tags			Upload
//	@Success		200	{object}	model.Upload
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/upload/{id} [get]
//	@Param			id	path	string	true	"Upload ID"
func getUpload(c *gin.Context) {
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
	c.JSON(http.StatusOK, upload)
}
