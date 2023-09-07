package web

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/guregu/null"
	"github.com/samber/lo"
	"gorm.io/gorm"
	"net/http"
	"strings"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/model/jsonb"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/types"
	"tableflow/go/pkg/util"
	"time"
)

type TemplateColumnCreateRequest struct {
	TemplateID        string                            `json:"template_id" example:"f0797968-becc-422a-b135-19de1d8c5d46"`
	Name              string                            `json:"name" example:"First Name"`
	Key               string                            `json:"key" example:"first_name"`
	Required          bool                              `json:"required" example:"false"`
	Description       string                            `json:"description" example:"The first name"`
	Validations       []TemplateColumnValidationRequest `json:"validations"`
	SuggestedMappings *[]string                         `json:"suggested_mappings"`
}

type TemplateColumnEditRequest struct {
	Name              *string                            `json:"name" example:"First Name"`
	Key               *string                            `json:"key" example:"first_name"`
	Required          *bool                              `json:"required" example:"false"`
	Description       *string                            `json:"description" example:"The first name"`
	Validations       *[]TemplateColumnValidationRequest `json:"validations"`
	SuggestedMappings *[]string                          `json:"suggested_mappings"`
}

type TemplateColumnValidationRequest struct {
	ID       int         `json:"id" example:"1"`
	Type     string      `json:"type" example:"filled"`
	Value    jsonb.JSONB `json:"value" swaggertype:"string" example:"true"`
	Message  string      `json:"message" example:"This column must contain a value"`
	Severity string      `json:"severity" example:"error"`
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
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("A column already exists with the key '%s'", req.Key)})
		return
	}

	suggestedMappings := make([]string, 0)
	if req.SuggestedMappings != nil {
		suggestedMappings, err = parseSuggestedMappings(*req.SuggestedMappings, template, nil)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("Invalid suggested mappings: %v", err.Error())})
			return
		}
	}

	templateColumn := model.TemplateColumn{
		ID:                model.NewID(),
		TemplateID:        template.ID,
		Name:              req.Name,
		Key:               req.Key,
		Required:          req.Required,
		Description:       null.NewString(req.Description, len(req.Description) != 0),
		SuggestedMappings: suggestedMappings,
		CreatedBy:         user.ID,
		UpdatedBy:         user.ID,
	}

	// Validations
	validations, err := parseRequestValidations(req.Validations, &templateColumn)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	err = tf.DB.Create(&templateColumn).Error
	if err != nil {
		tf.Log.Errorw("Could not create template column", "error", err, "template_id", req.TemplateID)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	if len(validations) != 0 {
		err = tf.DB.Create(validations).Error
		if err != nil {
			tf.Log.Errorw("Could not create validations", "error", err, "template_id", req.TemplateID)
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
			return
		}
		templateColumn.Validations = validations
	}

	template.TemplateColumns = append(template.TemplateColumns, &templateColumn)

	c.JSON(http.StatusOK, template)
}

// editTemplateColumn
//
//	@Summary		Edit template column
//	@Description	Edit a template column
//	@Tags			Template
//	@Success		200	{object}	model.Template
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/template-column/{id} [post]
//	@Param			id		path	string						true	"Template column ID"
//	@Param			body	body	TemplateColumnEditRequest	true	"Request body"
func editTemplateColumn(c *gin.Context, getWorkspaceUser func(*gin.Context, string) (string, error)) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No template column ID provided"})
		return
	}
	req := TemplateColumnEditRequest{}
	if err := c.BindJSON(&req); err != nil {
		tf.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
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

	// Change any field that exists on the request and are different
	save := false
	if req.Name != nil && *req.Name != templateColumn.Name && len(*req.Name) != 0 {
		templateColumn.Name = *req.Name
		save = true
	}
	if req.Key != nil && *req.Key != templateColumn.Key && len(*req.Key) != 0 {
		if !model.IsValidTemplateColumnKey(*req.Key) {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "The column key can only contain lowercase letters, numbers, and underscores"})
			return
		}
		keyAlreadyExists := lo.ContainsBy(template.TemplateColumns, func(tc *model.TemplateColumn) bool {
			return tc.Key == *req.Key
		})
		if keyAlreadyExists {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("A column already exists with the key '%s'", *req.Key)})
			return
		}
		templateColumn.Key = *req.Key
		save = true
	}
	if req.Required != nil && *req.Required != templateColumn.Required {
		templateColumn.Required = *req.Required
		save = true
	}
	if req.Description != nil && *req.Description != templateColumn.Description.String {
		templateColumn.Description = null.StringFromPtr(req.Description)
		save = true
	}
	if req.SuggestedMappings != nil {
		suggestedMappings, err := parseSuggestedMappings(*req.SuggestedMappings, template, templateColumn)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("Invalid suggested mappings: %v", err.Error())})
			return
		}
		templateColumn.SuggestedMappings = suggestedMappings
		save = true
	}
	if req.Validations != nil {
		// If validations are passed in, use these to overwrite the validations in the database
		//
		// Create: If the validation does not have an ID, add it to the database
		// Edit:   If the validation has an ID, do a lookup and perform an edit to the validation
		// Delete: If a validation does not exist on the request but does exist in the database, delete it
		var validationsToCreateOrEdit []*model.Validation
		for _, v := range *req.Validations {
			validation, err := validateValidation(v, templateColumn)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
				return
			}
			if validation.ID != 0 {
				// If the validation has an ID, make sure it exists in the template column
				exists := lo.ContainsBy(templateColumn.Validations, func(v *model.Validation) bool {
					return v.ID == validation.ID
				})
				if exists {
					validationsToCreateOrEdit = append(validationsToCreateOrEdit, validation)
				}
			} else {
				// If the validation does not have an idea, add it to be created
				validationsToCreateOrEdit = append(validationsToCreateOrEdit, validation)
			}
		}

		// Delete any validations that exist already on the template column and don't exist in the request with an ID
		existingValidationsProvided := lo.Filter(validationsToCreateOrEdit, func(v *model.Validation, _ int) bool {
			return v.ID != 0
		})
		validationsToDelete := util.DifferenceBy(templateColumn.Validations, existingValidationsProvided, func(v1 *model.Validation, v2 *model.Validation) bool {
			return v1.ID == v2.ID
		})
		if len(validationsToDelete) != 0 {
			err = tf.DB.Delete(&validationsToDelete).Error
			if err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("Could not delete validations: %v", err.Error())})
				return
			}
		}

		// Save validations to create or edit
		if len(validationsToCreateOrEdit) != 0 {
			err = tf.DB.Save(&validationsToCreateOrEdit).Error
			if err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: fmt.Sprintf("Could not create or update validations: %v", err.Error())})
				return
			}
		}

		// Add the new validations to the template column to return
		if validationsToCreateOrEdit == nil {
			validationsToCreateOrEdit = make([]*model.Validation, 0)
		}
		templateColumn.Validations = validationsToCreateOrEdit
	}

	if save {
		templateColumn.UpdatedBy = user.ID
		err = tf.DB.Save(&templateColumn).Error
		if err != nil {
			tf.Log.Errorw("Could not save template column", "error", err, "template_column_id", templateColumn.ID)
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
			return
		}
	}
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
		tf.Log.Errorw("Could not delete template column", "error", err, "template_column_id", templateColumn.ID)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	// Delete any validations attached to the template column
	if len(templateColumn.Validations) != 0 {
		err = tf.DB.Delete(templateColumn.Validations).Error
		if err != nil {
			tf.Log.Errorw("Could not delete template column validations", "error", err, "template_column_id", templateColumn.ID)
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
			return
		}
	}
	// Remove the deleted template column from the template to return
	_, i, ok := lo.FindIndexOf(template.TemplateColumns, func(tc *model.TemplateColumn) bool {
		return tc.ID.Equals(templateColumn.ID)
	})
	template.TemplateColumns = append(template.TemplateColumns[:i], template.TemplateColumns[i+1:]...)
	c.JSON(http.StatusOK, template)
}

func parseSuggestedMappings(suggestedMappings []string, template *model.Template, templateColumn *model.TemplateColumn) ([]string, error) {
	if len(suggestedMappings) == 0 {
		return suggestedMappings, nil
	}
	// Remove any leading and trailing spaces
	suggestedMappings = lo.Map(suggestedMappings, func(str string, _ int) string {
		return strings.TrimSpace(str)
	})
	// Make sure the new mappings are all unique (case-insensitive) and don't contain blank values
	seen := make(map[string]bool)
	for _, str := range suggestedMappings {
		if util.IsBlankUnicode(str) {
			return []string{}, fmt.Errorf("cannot contain blank values")
		}
		str = strings.ToLower(str)
		if seen[str] {
			return []string{}, fmt.Errorf("cannot contain duplicate values '%v'", str)
		}
		seen[str] = true
	}
	// Make sure the new mappings are unique across other mappings for all template columns in the template
	type nameAndSuggestion struct {
		name       string
		suggestion string
	}
	var allOtherSuggestedMappings []nameAndSuggestion
	for _, tc := range template.TemplateColumns {
		if templateColumn != nil && templateColumn.ID.Equals(tc.ID) {
			// Don't add the mappings of the current template column, if provided (edit request)
			continue
		}
		for _, str := range tc.SuggestedMappings {
			allOtherSuggestedMappings = append(allOtherSuggestedMappings, nameAndSuggestion{
				name:       tc.Name,
				suggestion: str,
			})
		}
	}
	for _, str := range suggestedMappings {
		orig := str
		str = strings.ToLower(str)
		for _, mapping := range allOtherSuggestedMappings {
			if str == strings.ToLower(mapping.suggestion) {
				return []string{}, fmt.Errorf("suggestions must be unique across all columns in the template. The value '%v' is already used in the column '%v'", orig, mapping.name)
			}
		}
	}
	return suggestedMappings, nil
}

func parseRequestValidations(reqValidations []TemplateColumnValidationRequest, templateColumn *model.TemplateColumn) ([]*model.Validation, error) {
	var validations []*model.Validation
	for _, v := range reqValidations {
		validation, err := validateValidation(v, templateColumn)
		if err != nil {
			return nil, err
		}
		validations = append(validations, validation)
	}
	return validations, nil
}

func validateValidation(v TemplateColumnValidationRequest, templateColumn *model.TemplateColumn) (*model.Validation, error) {
	switch v.Type {
	case model.ValidationFilled.Name:
		if !v.Value.Valid {
			v.Value = jsonb.JSONB{
				Data:  true,
				Valid: true,
			}
		}
		if len(v.Message) == 0 {
			v.Message = "The cell must be filled"
		}
		switch v.Severity {
		case "":
			// Default to error if not provided
			v.Severity = string(model.ValidationSeverityError)
		case string(model.ValidationSeverityError), string(model.ValidationSeverityWarn), string(model.ValidationSeverityInfo):
			// Do nothing, the severity is provided and valid
		default:
			return nil, fmt.Errorf("The validation severity %v is invalid", v.Severity)
		}
		return &model.Validation{
			ID:               uint(v.ID),
			TemplateColumnID: templateColumn.ID,
			Type:             model.ValidationType{Name: v.Type},
			Value:            v.Value,
			Message:          v.Message,
			Severity:         model.ValidationSeverity(v.Severity),
		}, nil
	//
	//case model.ValidationRegex.Name:
	//
	default:
		return nil, fmt.Errorf("The validation type %v is invalid", v.Type)
	}
}
