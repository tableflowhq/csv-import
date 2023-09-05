package model

import (
	"github.com/guregu/null"
	"gorm.io/gorm"
	"tableflow/go/pkg/model/jsonb"
)

type Import struct {
	ID                 ID          `json:"id" swaggertype:"string" example:"da5554e3-6c87-41b2-9366-5449a2f15b53"`
	UploadID           ID          `json:"upload_id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	ImporterID         ID          `json:"importer_id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	WorkspaceID        ID          `json:"workspace_id" swaggertype:"string" example:"b2079476-261a-41fe-8019-46eb51c537f7"`
	NumRows            null.Int    `json:"num_rows" swaggertype:"integer" example:"256"`
	NumColumns         null.Int    `json:"num_columns" swaggertype:"integer" example:"8"`
	NumProcessedValues null.Int    `json:"num_processed_values" swaggertype:"integer" example:"128"`
	Metadata           jsonb.JSONB `json:"metadata"`
	IsStored           bool        `json:"is_stored" example:"false"`
	NumErrorRows       null.Int    `json:"num_error_rows" swaggertype:"integer" example:"32"`
	NumValidRows       null.Int    `json:"num_valid_rows" swaggertype:"integer" example:"224"`
	CreatedAt          NullTime    `json:"created_at" swaggertype:"integer" example:"1682366228"`

	Importer *Importer `json:"importer,omitempty" swaggerignore:"true" gorm:"foreignKey:ID;references:ImporterID"`
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
