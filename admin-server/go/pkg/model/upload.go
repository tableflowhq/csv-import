package model

import (
	"github.com/guregu/null"
	"gorm.io/gorm"
)

type Upload struct {
	ID             ID          `json:"id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	TusID          string      `json:"tus_id" example:"ee715c254ee61855b465ed61be930487"`
	ImporterID     ID          `json:"importer_id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	WorkspaceID    ID          `json:"workspace_id" swaggertype:"string" example:"b2079476-261a-41fe-8019-46eb51c537f7"`
	FileName       null.String `json:"file_name" swaggertype:"string" example:"example.csv"`
	FileType       null.String `json:"file_type" swaggertype:"string" example:"text/csv"`
	FileExtension  null.String `json:"file_extension" swaggertype:"string" example:"csv"`
	FileSize       null.Int    `json:"file_size" swaggertype:"integer" example:"1024"`
	NumRows        null.Int    `json:"num_rows" swaggertype:"integer" example:"256"`
	NumColumns     null.Int    `json:"num_columns" swaggertype:"integer" example:"8"`
	Template       JSONB       `json:"template" swaggertype:"string" example:"{}"` // Set if the user passes in a template to the SDK (which overrides the template on the importer) or if a schemaless import occurs
	Schemaless     bool        `json:"schemaless" example:"false"`
	Metadata       JSONB       `json:"metadata" swaggertype:"string" example:"{\"user_id\": 1234}"`
	IsStored       bool        `json:"is_stored" example:"false"`
	HeaderRowIndex null.Int    `json:"header_row_index" swaggertype:"integer" example:"0"`
	Error          null.String `json:"-" swaggerignore:"true"`
	CreatedAt      NullTime    `json:"created_at" swaggertype:"integer" example:"1682366228"`

	Importer      *Importer       `json:"importer,omitempty" swaggerignore:"true" gorm:"foreignKey:ID;references:ImporterID"`
	UploadColumns []*UploadColumn `json:"upload_columns"`
}

func (u *Upload) BeforeCreate(_ *gorm.DB) (err error) {
	if !u.ID.Valid {
		u.ID = NewID()
	}
	if u.Metadata == nil {
		u.Metadata = make(map[string]interface{})
	}
	return
}
