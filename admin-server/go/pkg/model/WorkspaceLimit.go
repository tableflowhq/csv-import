package model

import (
	"github.com/guregu/null"
	"gorm.io/gorm"
)

// WorkspaceLimit the monthly limits for a workspace
type WorkspaceLimit struct {
	ID              ID       `json:"id" swaggertype:"string" example:"c44c948f-6061-45c9-aa6a-40373f6dcdad"`
	WorkspaceID     ID       `json:"workspace_id" swaggertype:"string" example:"b2079476-261a-41fe-8019-46eb51c537f7"`
	Users           null.Int `json:"users" swaggertype:"integer" example:"10"`
	Importers       null.Int `json:"importers" swaggertype:"integer" example:"10"`
	Files           null.Int `json:"files" swaggertype:"integer" example:"10000"`
	Rows            null.Int `json:"rows" swaggertype:"integer" example:"1000000"`
	RowsPerImport   null.Int `json:"rows_per_import" swaggertype:"integer" example:"10000"`
	ProcessedValues null.Int `json:"processed_values" swaggertype:"integer" example:"100000000"`

	Workspace *Workspace `json:"workspace,omitempty" swaggerignore:"true" gorm:"foreignKey:ID;references:WorkspaceID"`
}

func (wl *WorkspaceLimit) BeforeCreate(_ *gorm.DB) (err error) {
	if !wl.ID.Valid {
		wl.ID = NewID()
	}
	return
}
