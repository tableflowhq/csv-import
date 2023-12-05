package model

import (
	"github.com/guregu/null"
	"github.com/lib/pq"
	"gorm.io/gorm"
	"tableflow/go/pkg/model/jsonb"
)

type Upload struct {
	ID                    ID             `json:"id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	TusID                 string         `json:"tus_id" example:"ee715c254ee61855b465ed61be930487"`
	FileName              null.String    `json:"file_name" swaggertype:"string" example:"example.csv"`
	FileType              null.String    `json:"file_type" swaggertype:"string" example:"text/csv"`
	FileExtension         null.String    `json:"file_extension" swaggertype:"string" example:"csv"`
	FileSize              null.Int       `json:"file_size" swaggertype:"integer" example:"1024"`
	NumRows               null.Int       `json:"num_rows" swaggertype:"integer" example:"256"`
	NumColumns            null.Int       `json:"num_columns" swaggertype:"integer" example:"8"`
	Template              jsonb.JSONB    `json:"template" swaggertype:"string" example:"{}"` // Set if the user passes in a template to the SDK (which overrides the template on the importer) or if a schemaless import occurs
	Schemaless            bool           `json:"schemaless" example:"false"`
	Metadata              jsonb.JSONB    `json:"metadata" swaggertype:"string" example:"{\"user_id\": 1234}"`
	IsStored              bool           `json:"is_stored" example:"false"`
	HeaderRowIndex        null.Int       `json:"header_row_index" swaggertype:"integer" example:"0"`
	MatchedHeaderRowIndex null.Int       `json:"matched_header_row_index" swaggertype:"integer" example:"0"`
	SheetList             pq.StringArray `json:"sheet_list" gorm:"type:text[]" swaggertype:"array,string" example:"Sheet 1"`
	Error                 null.String    `json:"-" swaggerignore:"true"`

	UploadColumns []*UploadColumn `json:"upload_columns"`
}

func (u *Upload) BeforeCreate(_ *gorm.DB) (err error) {
	if !u.ID.Valid {
		u.ID = NewID()
	}
	if !u.Metadata.Valid {
		u.Metadata = jsonb.NewEmpty()
	}
	return
}
