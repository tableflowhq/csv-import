package web

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type Res struct {
	Err     string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

// health
//
//	@Summary		Health
//	@Description	Health check
//	@Tags			Public
//	@Success		200	{object}	Res
//	@Router			/public/health [get]
func health(c *gin.Context) {
	c.JSON(http.StatusOK, Res{Message: "ok"})
}
