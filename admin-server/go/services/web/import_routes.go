package web

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"tableflow/go/pkg/db"
)

// getImport
//
//	@Summary		Get import
//	@Description	Get a single import
//	@Tags			Import
//	@Success		200	{object}	model.Import
//	@Failure		400	{object}	Res
//	@Router			/admin/v1/import/{id} [get]
//	@Param			id	path	string	true	"Import ID"
func getImport(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No import ID provided"})
		return
	}
	imp, err := db.GetImportForAdminAPI(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
		return
	}
	_, err = validateUserInWorkspace(c, imp.WorkspaceID.String())
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, imp)
}

// getImports
//
//	@Summary		Get imports
//	@Description	Get a list of imports
//	@Tags			Import
//	@Success		200	{object}	[]model.Import
//	@Failure		400	{object}	Res
//	@Router			/admin/v1/imports/{workspace-id} [get]
//	@Param			workspace-id	path	string	true	"Workspace ID"
func getImports(c *gin.Context) {
	workspaceID := c.Param("workspace-id")
	if len(workspaceID) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No workspace ID provided"})
		return
	}
	_, err := validateUserInWorkspace(c, workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, Res{Err: err.Error()})
		return
	}
	imports, err := db.GetImportsForAdminAPI(workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, imports)
}
