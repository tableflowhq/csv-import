package web

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/guregu/null"
	"github.com/samber/lo"
	"net/http"
	"strings"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/types"
	"tableflow/go/pkg/util"
)

type ImporterCreateRequest struct {
	Name string `json:"name" example:"Test Importer"`
}

type ImporterEditRequest struct {
	Name           *string   `json:"name" example:"Test Importer"`
	AllowedDomains *[]string `json:"allowed_domains" example:"example.com"`
	WebhookURL     *string   `json:"webhook_url" example:"https://example.com/webhook"`
}

// createImporter
//
//	@Summary		Create importer
//	@Description	Create an importer
//	@Tags			Importer
//	@Success		200	{object}	model.Importer
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/importer [post]
//	@Param			body	body	ImporterCreateRequest	true	"Request body"
func createImporter(c *gin.Context) {
	req := ImporterCreateRequest{}
	if err := c.BindJSON(&req); err != nil {
		util.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	if len(req.Name) == 0 {
		req.Name = "My Importer"
	}
	importer := model.Importer{
		ID:   model.NewID(),
		Name: req.Name,
	}
	err := db.DB.Omit(db.OpenModelOmitFields...).Create(&importer).Error
	if err != nil {
		util.Log.Errorw("Could not create importer", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	// Right now, templates are 1:1 with importers. Create a default template to be used by the importer
	template := model.Template{
		ID:         model.NewID(),
		ImporterID: importer.ID,
		Name:       "Default Template",
	}
	err = db.DB.Omit(db.OpenModelOmitFields...).Create(&template).Error
	if err != nil {
		util.Log.Errorw("Could not create template for importer", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, &importer)
}

// getImporter
//
//	@Summary		Get importer
//	@Description	Get a single importer
//	@Tags			Importer
//	@Success		200	{object}	model.Importer
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/importer/{id} [get]
//	@Param			id	path	string	true	"Importer ID"
func getImporter(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No importer ID provided"})
		return
	}
	importer, err := db.GetImporter(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, importer)
}

// getImporters
//
//	@Summary		Get importers
//	@Description	Get a list of importers
//	@Tags			Importer
//	@Success		200	{object}	[]model.Importer
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/importers [get]
func getImporters(c *gin.Context) {
	var importers []*model.Importer
	err := db.DB.Preload("Template.TemplateColumns").Find(&importers).Error
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, importers)
}

// editImporter
//
//	@Summary		Edit importer
//	@Description	Edit an importer
//	@Tags			Importer
//	@Success		200	{object}	model.Importer
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/importer/{id} [post]
//	@Param			id		path	string				true	"Importer ID"
//	@Param			body	body	ImporterEditRequest	true	"Request body"
func editImporter(c *gin.Context) {
	id := c.Param("id")
	if len(id) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "No importer ID provided"})
		return
	}
	req := ImporterEditRequest{}
	if err := c.BindJSON(&req); err != nil {
		util.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	importer, err := db.GetImporter(id)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}

	// Change any field that exists on the request and are different
	save := false
	if req.Name != nil && *req.Name != importer.Name {
		importer.Name = *req.Name
		save = true
	}
	if req.WebhookURL != nil && *req.WebhookURL != importer.WebhookURL.String {
		if len(*req.WebhookURL) == 0 {
			importer.WebhookURL = null.NewString("", false)
		} else {
			if !util.IsValidURL(*req.WebhookURL) {
				c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: "Invalid webhook URL"})
				return
			}
			importer.WebhookURL = null.StringFromPtr(req.WebhookURL)
		}
		save = true
	}
	if req.AllowedDomains != nil && !util.EqualContents(*req.AllowedDomains, importer.AllowedDomains) {
		// Loosely validate the domains
		invalidDomains := make([]string, 0)
		for _, d := range *req.AllowedDomains {
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
		importer.AllowedDomains = *req.AllowedDomains
		save = true
	}

	if save {
		err = db.DB.Omit(db.OpenModelOmitFields...).Save(importer).Error
		if err != nil {
			util.Log.Errorw("Could not save importer", "error", err, "importer_id", importer.ID)
			c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, importer)
}
