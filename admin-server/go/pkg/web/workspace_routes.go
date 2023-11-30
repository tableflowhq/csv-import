package web

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"net/http"
	"strings"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/evaluator"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/types"
	"tableflow/go/pkg/util"
)

type WorkspaceEditRequest struct {
	AllowedImportDomains *[]string `json:"allowed_import_domains" example:"example.com"`
}

// getWorkspace
//
//	@Summary		Get workspace
//	@Description	Get a workspace
//	@Tags			Workspace
//	@Success		200	{object}	model.Workspace
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/workspace/{id} [get]
//	@Param			id	path	string	true	"Workspace ID"
func getWorkspace(c *gin.Context, getWorkspaceUser func(*gin.Context, string) (string, error)) {
	workspaceID := c.Param("id")
	if len(workspaceID) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No workspace ID provided"})
		return
	}
	_, err := getWorkspaceUser(c, workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
		return
	}

	workspace, err := db.GetWorkspace(workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, workspace)
}

// editWorkspace
//
//	@Summary		Edit workspace
//	@Description	Edit a workspace
//	@Tags			Workspace
//	@Success		200	{object}	model.Workspace
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/workspace/{id} [post]
//	@Param			id		path	string				true	"Workspace ID"
//	@Param			body	body	WorkspaceEditRequest	true	"Request body"
func editWorkspace(c *gin.Context, getWorkspaceUser func(*gin.Context, string) (string, error)) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No workspace ID provided"})
		return
	}
	req := WorkspaceEditRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		tf.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	workspace, err := db.GetWorkspace(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	userID, err := getWorkspaceUser(c, id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
		return
	}
	user := model.User{ID: model.ParseID(userID)}

	// Change any field that exists on the request and are different
	save := false
	if req.AllowedImportDomains != nil && !util.EqualContents(*req.AllowedImportDomains, workspace.AllowedImportDomains) {
		// Loosely validate the domains
		invalidDomains := make([]string, 0)
		for _, d := range *req.AllowedImportDomains {
			if !util.IsValidDomain(d) {
				invalidDomains = append(invalidDomains, d)
			}
		}
		if len(invalidDomains) != 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{
				Err: fmt.Sprintf("Invalid domain%s: %s - Domains must be in the format 'example.com' or 'www.example.com' and not complete URLs.",
					lo.Ternary(len(invalidDomains) == 1, "", "s"), strings.Join(invalidDomains, ", ")),
			})
			return
		}
		workspace.AllowedImportDomains = *req.AllowedImportDomains
		save = true
	}

	if save {
		workspace.UpdatedBy = user.ID
		err = tf.DB.Save(workspace).Error
		if err != nil {
			tf.Log.Errorw("Could not save workspace", "error", err, "workspace_id", workspace.ID)
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, workspace)
}

// getWorkspaceAPIKey
//
//	@Summary		Get workspace API key
//	@Description	Get the current API key of a workspace
//	@Tags			Workspace
//	@Success		200	{object}	string
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/workspace/{id}/api-key [get]
//	@Param			id	path	string	true	"Workspace ID"
func getWorkspaceAPIKey(c *gin.Context, getWorkspaceUser func(*gin.Context, string) (string, error)) {
	workspaceID := c.Param("id")
	if len(workspaceID) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No workspace ID provided"})
		return
	}
	_, err := getWorkspaceUser(c, workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
		return
	}
	apiKey, err := db.GetAPIKey(workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, apiKey)
}

// regenerateWorkspaceAPIKey
//
//	@Summary		Regenerate workspace API key
//	@Description	Regenerate the current API key of a workspace and return the new API key
//	@Tags			Workspace
//	@Success		200	{object}	string
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/workspace/{id}/api-key [post]
//	@Param			id	path	string	true	"Workspace ID"
func regenerateWorkspaceAPIKey(c *gin.Context, getWorkspaceUser func(*gin.Context, string) (string, error)) {
	workspaceID := c.Param("id")
	if len(workspaceID) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No workspace ID provided"})
		return
	}
	_, err := getWorkspaceUser(c, workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
		return
	}
	apiKey, err := db.RegenerateAPIKey(workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, apiKey)
}

type ValidateAllowed struct {
	Validate string `json:"validate"`
	Allowed  bool   `json:"allowed"`
}

// getWorkspaceDataTypeValidations
//
//	@Summary		Get datatype validations
//	@Description	Get a map of available data types and allowed validations
//	@Tags			Workspace
//	@Success		200	{object}	map[string][]ValidateAllowed
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/workspace/{id}/datatype-validations [get]
//	@Param			id	path	string	true	"Workspace ID"
func getWorkspaceDataTypeValidations(c *gin.Context, getWorkspaceUser func(*gin.Context, string) (string, error), getAllowedValidateTypes func(string) map[string]bool) {
	workspaceID := c.Param("id")
	if len(workspaceID) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No workspace ID provided"})
		return
	}
	_, err := getWorkspaceUser(c, workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
		return
	}

	allowedValidateTypes := getAllowedValidateTypes(workspaceID)
	dataTypeValidations := make(map[string][]ValidateAllowed)

	for dataType, validations := range evaluator.DataTypeValidations {
		var newValidations []ValidateAllowed
		for _, validation := range validations {
			newValidations = append(newValidations, ValidateAllowed{
				Validate: validation,
				Allowed:  allowedValidateTypes == nil || allowedValidateTypes[validation],
			})
		}
		dataTypeValidations[dataType] = newValidations
	}

	c.JSON(http.StatusOK, &dataTypeValidations)
}
