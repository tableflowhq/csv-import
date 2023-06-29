package web

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/types"
)

// getImport
//
//	@Summary		Get import
//	@Description	Get a single import
//	@Tags			Import
//	@Success		200	{object}	model.Import
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/import/{id} [get]
//	@Param			id	path	string	true	"Import ID"
func getImport(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No import ID provided"})
		return
	}
	imp, err := db.GetImportForAdminAPI(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
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
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/imports [get]
func getImports(c *gin.Context) {
	imports, err := getImportsFromDB()
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, imports)
}

func getImportsFromDB() ([]*model.Import, error) {
	var imports []*model.Import
	err := db.DB.Preload("Importer").
		Omit("StorageBucket").
		Order("created_at desc").
		Find(&imports).Error
	if err != nil {
		return nil, err
	}
	return imports, nil
}
