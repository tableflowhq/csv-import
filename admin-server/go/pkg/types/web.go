package types

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"strconv"
)

type Res struct {
	Err     string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

type Pagination struct {
	Total  int `json:"total"`
	Offset int `json:"offset"`
	Limit  int `json:"limit"`
}

const PaginationDefaultOffset = 0
const PaginationDefaultLimit = 100
const PaginationMaxLimit = 1000

func ParsePaginationQuery(c *gin.Context) (Pagination, error) {
	offsetParam, _ := c.GetQuery("offset")
	limitParam, _ := c.GetQuery("limit")
	offset := 0
	limit := 0

	pagination := Pagination{}

	if len(offsetParam) == 0 && len(limitParam) != 0 {
		return pagination, fmt.Errorf("The parameter 'offset' is required when providing a limit")
	}
	if len(limitParam) == 0 && len(offsetParam) != 0 {
		return pagination, fmt.Errorf("The parameter 'limit' is required when providing a offset")
	}
	if len(offsetParam) == 0 && len(limitParam) == 0 {
		offset = PaginationDefaultOffset
		limit = PaginationDefaultLimit
	} else {
		var err error
		offset, err = strconv.Atoi(offsetParam)
		if err != nil {
			return pagination, fmt.Errorf("Invalid offset parameter")
		}
		if offset < 0 {
			return pagination, fmt.Errorf("Offset must be positive")
		}
		limit, err = strconv.Atoi(limitParam)
		if err != nil {
			return pagination, fmt.Errorf("Invalid limit parameter")
		}
		if limit < 1 {
			return pagination, fmt.Errorf("Limit must be greater than 1")
		}
		if limit > PaginationMaxLimit {
			return pagination, fmt.Errorf("Limit cannot be greater than %v", PaginationMaxLimit)
		}
	}
	pagination.Limit = limit
	pagination.Offset = offset
	return pagination, nil
}
