package web

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/types"
)

// getOrganizationWorkspaces
//
//	@Summary		Get organization and attached workspaces
//	@Description	Get the current user's organization and workspaces that are a part of the organization
//	@Tags			Organization
//	@Success		200	{object}	model.Organization
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/organization-workspaces [get]
func getOrganizationWorkspaces(c *gin.Context, getUserID func(*gin.Context) string) {
	userID := getUserID(c)
	if len(userID) == 0 {
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: "User not logged in"})
		return
	}
	organization, err := db.GetOrganizationOfUserWithWorkspaces(userID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, organization)
}
