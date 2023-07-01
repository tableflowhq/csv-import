package web

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"tableflow/go/pkg/types"
)

// Health
//
//	@Summary		Health
//	@Description	Health check
//	@Tags			Public
//	@Success		200	{object}	types.Res
//	@Router			/public/health [get]
func Health(c *gin.Context) {
	c.JSON(http.StatusOK, types.Res{Message: "ok"})
}
