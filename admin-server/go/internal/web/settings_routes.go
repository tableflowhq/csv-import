package web

import (
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/types"
)

// getAPIKey
//
//	@Summary		Get API key
//	@Description	Get the current API key
//	@Tags			API Key
//	@Success		200	{object}	string
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/settings/api-key [get]
func getAPIKey(c *gin.Context) {
	apiKey, err := getAPIKeyFromDB()
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, apiKey)
}

// regenerateAPIKey
//
//	@Summary		Regenerate API key
//	@Description	Regenerate the current API key and return the new API key
//	@Tags			API Key
//	@Success		200	{object}	string
//	@Failure		400	{object}	types.Res
//	@Router			/admin/v1/settings/api-key [post]
func regenerateAPIKey(c *gin.Context) {
	apiKey, err := regenerateAPIKeyFromDB()
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, types.Res{Err: err.Error()})
		return
	}
	c.JSON(http.StatusOK, apiKey)
}

func getAPIKeyFromDB() (string, error) {
	type Res struct {
		APIKey string
	}
	var res Res
	err := db.DB.Raw("select api_key from settings;").Scan(&res).Error
	if err != nil {
		return "", err
	}
	if len(res.APIKey) == 0 {
		return "", errors.New("not found")
	}
	return res.APIKey, err
}

func regenerateAPIKeyFromDB() (string, error) {
	type Res struct {
		APIKey string
	}
	var res Res
	err := db.DB.Raw("update settings set api_key = concat('tf_', replace(gen_random_uuid()::text, '-', '')) returning api_key;").Scan(&res).Error
	if err != nil {
		return "", err
	}
	if len(res.APIKey) == 0 {
		return "", errors.New("not found")
	}
	return res.APIKey, err
}
