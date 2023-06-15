package web

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"tableflow/go/pkg/db"
)

type WorkspaceUsageLimit struct {
	WorkspaceID             string   `json:"workspace_id" example:"b2079476-261a-41fe-8019-46eb51c537f7"`
	Month                   string   `json:"month" example:"2023-06-01"`
	NumFiles                int64    `json:"num_files" example:"10000"`
	NumFilesLimit           *int64   `json:"num_files_limit" example:"10000"`
	NumRows                 int64    `json:"num_rows" example:"10000"`
	NumRowsLimit            *int64   `json:"num_rows_limit" example:"10000"`
	NumProcessedValues      int64    `json:"num_processed_values" example:"10000"`
	NumProcessedValuesLimit *int64   `json:"num_processed_values_limit" example:"10000"`
	TotalFileSizeMB         float64  `json:"total_file_size_mb" example:"10000"`
	TotalFileSizeMBLimit    *float64 `json:"total_file_size_mb_limit" example:"10000"`
}

// getWorkspaceAPIKey
//
//	@Summary		Get workspace API key
//	@Description	Get the current API key of a workspace
//	@Tags			Workspace
//	@Success		200	{object}	string
//	@Failure		400	{object}	Res
//	@Router			/admin/v1/workspace/{id}/api-key [get]
//	@Param			id	path	string	true	"Workspace ID"
func getWorkspaceAPIKey(c *gin.Context) {
	workspaceID := c.Param("id")
	if len(workspaceID) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No workspace ID provided"})
		return
	}
	_, err := validateUserInWorkspace(c, workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, Res{Err: err.Error()})
		return
	}
	apiKey, err := db.GetAPIKey(workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
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
//	@Failure		400	{object}	Res
//	@Router			/admin/v1/workspace/{id}/api-key [post]
//	@Param			id	path	string	true	"Workspace ID"
func regenerateWorkspaceAPIKey(c *gin.Context) {
	workspaceID := c.Param("id")
	if len(workspaceID) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No workspace ID provided"})
		return
	}
	_, err := validateUserInWorkspace(c, workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, Res{Err: err.Error()})
		return
	}
	apiKey, err := db.RegenerateAPIKey(workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, apiKey)
}

// getWorkspaceUsage
//
//	@Summary		Get workspace usage
//	@Description	Get the workspace usage for the current month
//	@Tags			Workspace
//	@Success		200	{object}	WorkspaceUsageLimit
//	@Failure		400	{object}	Res
//	@Router			/admin/v1/workspace/{id}/usage [get]
//	@Param			id	path	string	true	"Workspace ID"
func getWorkspaceUsage(c *gin.Context) {
	workspaceID := c.Param("id")
	if len(workspaceID) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: "No workspace ID provided"})
		return
	}
	_, err := validateUserInWorkspace(c, workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, Res{Err: err.Error()})
		return
	}
	usage, err := db.GetWorkspaceUsageCurrentMonth(workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
		return
	}
	limit, err := db.GetWorkspaceLimit(workspaceID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, Res{Err: err.Error()})
		return
	}
	workspaceLimitUsage := &WorkspaceUsageLimit{
		WorkspaceID:             workspaceID,
		Month:                   usage.Month,
		NumFiles:                usage.NumFiles,
		NumFilesLimit:           limit.Files.Ptr(),
		NumRows:                 usage.NumRows,
		NumRowsLimit:            limit.Rows.Ptr(),
		NumProcessedValues:      usage.NumProcessedValues,
		NumProcessedValuesLimit: limit.ProcessedValues.Ptr(),
		TotalFileSizeMB:         usage.TotalFileSizeMB,
		TotalFileSizeMBLimit:    nil,
	}
	c.JSON(http.StatusOK, workspaceLimitUsage)
}
