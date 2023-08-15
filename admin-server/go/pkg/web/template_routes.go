package web

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/guregu/null"
	"github.com/samber/lo"
	"gorm.io/gorm"
	"net/http"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/types"
	"time"
)

type TemplateColumnCreateRequest struct {
	TemplateID  string `json:"template_id" example:"f0797968-becc-422a-b135-19de1d8c5d46"`
	Name        string `json:"name" example:"First Name"`
	Key         string `json:"key" example:"first_name"`
	Required    bool   `json:"required" example:"false"`
	Description string `json:"description" example:"The first name"`
}

// getTemplate
//
//	@Summary		Get template
//	@Description	Get a single template
//	@Tags			Template
//	@Success		200	{object}	model.Template
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/template/{id} [get]
//	@Param			id	path	string	true	"Template ID"
func getTemplate(c *gin.Context, getWorkspaceUser func(*gin.Context, string) (string, error)) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No template ID provided"})
		return
	}
	template, err := db.GetTemplateWithUsers(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	_, err = getWorkspaceUser(c, template.WorkspaceID.String())
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, template)
}

// createTemplateColumn
//
//	@Summary		Create template column
//	@Description	Create a template column
//	@Tags			Template
//	@Success		200	{object}	model.Template
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/template-column [post]
//	@Param			body	body	TemplateColumnCreateRequest	true	"Request body"
func createTemplateColumn(c *gin.Context, getWorkspaceUser func(*gin.Context, string) (string, error)) {
	req := TemplateColumnCreateRequest{}
	if err := c.BindJSON(&req); err != nil {
		tf.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	template, err := db.GetTemplate(req.TemplateID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Template does not exist"})
		return
	}
	userID, err := getWorkspaceUser(c, template.WorkspaceID.String())
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
		return
	}
	user := model.User{ID: model.ParseID(userID)}

	// Basic validation
	if len(req.Name) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No column name provided"})
		return
	}
	if !model.IsValidTemplateColumnKey(req.Key) {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The column key can only contain lowercase letters, numbers, and underscores"})
		return
	}
	keyAlreadyExists := lo.ContainsBy(template.TemplateColumns, func(tc *model.TemplateColumn) bool {
		return tc.Key == req.Key
	})
	if keyAlreadyExists {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("A column already exists with the key %s", req.Key)})
		return
	}

	templateColumn := model.TemplateColumn{
		ID:          model.NewID(),
		TemplateID:  template.ID,
		Name:        req.Name,
		Key:         req.Key,
		Required:    req.Required,
		Description: null.NewString(req.Description, len(req.Description) != 0),
		CreatedBy:   user.ID,
		UpdatedBy:   user.ID,
	}
	err = tf.DB.Create(&templateColumn).Error
	if err != nil {
		tf.Log.Errorw("Could not create template column", "error", err, "template_id", req.TemplateID)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	template.TemplateColumns = append(template.TemplateColumns, &templateColumn)
	c.JSON(http.StatusOK, template)
}

// deleteTemplateColumn
//
//	@Summary		Delete template column
//	@Description	Delete a template column
//	@Tags			Template
//	@Success		200	{object}	model.Template
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/template-column/{id} [delete]
//	@Param			id	path	string	true	"Template column ID"
func deleteTemplateColumn(c *gin.Context, getWorkspaceUser func(*gin.Context, string) (string, error)) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No template column ID provided"})
		return
	}

	template, err := db.GetTemplateByTemplateColumnID(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Template or template column does not exist"})
		return
	}
	userID, err := getWorkspaceUser(c, template.WorkspaceID.String())
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, types.Res{Err: err.Error()})
		return
	}
	user := model.User{ID: model.ParseID(userID)}

	templateColumn, ok := lo.Find(template.TemplateColumns, func(tc *model.TemplateColumn) bool {
		return tc.ID.EqualsString(id)
	})
	if !ok {
		// This shouldn't be possible unless it was deleted by another user before this request could be made
		c.AbortWithStatusJSON(http.StatusInternalServerError, types.Res{Err: "Unable to find template column"})
		return
	}
	templateColumn.DeletedBy = user.ID
	templateColumn.DeletedAt = gorm.DeletedAt{Time: time.Now(), Valid: true}
	err = tf.DB.Save(&templateColumn).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	// Remove the deleted template column from the template to return
	_, i, ok := lo.FindIndexOf(template.TemplateColumns, func(tc *model.TemplateColumn) bool {
		return tc.ID.Equals(templateColumn.ID)
	})
	template.TemplateColumns = append(template.TemplateColumns[:i], template.TemplateColumns[i+1:]...)
	c.JSON(http.StatusOK, template)
}
