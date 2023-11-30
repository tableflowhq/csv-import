package model

import (
	"github.com/guregu/null"
	"gorm.io/gorm"
	"tableflow/go/pkg/model/jsonb"
)

type Import struct {
	ID                 ID          `json:"id" swaggertype:"string" example:"da5554e3-6c87-41b2-9366-5449a2f15b53"`
	UploadID           ID          `json:"upload_id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	NumRows            null.Int    `json:"num_rows" swaggertype:"integer" example:"256"`
	NumColumns         null.Int    `json:"num_columns" swaggertype:"integer" example:"8"`
	NumProcessedValues null.Int    `json:"num_processed_values" swaggertype:"integer" example:"128"`
	Metadata           jsonb.JSONB `json:"metadata"`
	DataTypes          jsonb.JSONB `json:"data_types"`
	IsStored           bool        `json:"is_stored" example:"false"`
	IsComplete         bool        `json:"is_complete" example:"false"`
	NumErrorRows       null.Int    `json:"num_error_rows" swaggertype:"integer" example:"32"`
	NumValidRows       null.Int    `json:"num_valid_rows" swaggertype:"integer" example:"224"`

	Upload *Upload `json:"upload,omitempty" swaggerignore:"true" gorm:"foreignKey:ID;references:UploadID"`
}

func (i *Import) BeforeCreate(_ *gorm.DB) (err error) {
	if !i.ID.Valid {
		i.ID = NewID()
	}
	if !i.Metadata.Valid {
		i.Metadata = jsonb.NewEmpty()
	}
	return
}

func (i *Import) HasErrors() bool {
	return i.NumErrorRows.Int64 != 0
}
