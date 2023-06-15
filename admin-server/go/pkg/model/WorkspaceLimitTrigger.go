package model

import (
	"gorm.io/gorm"
)

type WorkspaceLimitTriggerType string

const (
	WorkspaceLimitTriggerTypeUsers           WorkspaceLimitTriggerType = "users"
	WorkspaceLimitTriggerTypeImporters       WorkspaceLimitTriggerType = "importers"
	WorkspaceLimitTriggerTypeFiles           WorkspaceLimitTriggerType = "files"
	WorkspaceLimitTriggerTypeRows            WorkspaceLimitTriggerType = "rows"
	WorkspaceLimitTriggerTypeRowsPerImport   WorkspaceLimitTriggerType = "rows_per_import"
	WorkspaceLimitTriggerTypeProcessedValues WorkspaceLimitTriggerType = "processed_values"
)

// WorkspaceLimitTrigger created whenever a workspace limit is reached
type WorkspaceLimitTrigger struct {
	ID               ID                        `json:"id" swaggertype:"string" example:"777a5828-c998-443f-a4e5-83322a2bb0dc"`
	WorkspaceID      ID                        `json:"workspace_id" swaggertype:"string" example:"b2079476-261a-41fe-8019-46eb51c537f7"`
	WorkspaceLimitID ID                        `json:"workspace_limit_id" swaggertype:"string" example:"c44c948f-6061-45c9-aa6a-40373f6dcdad"`
	UploadID         ID                        `json:"upload_id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	LimitType        WorkspaceLimitTriggerType `json:"limit_type" example:"rows"`
	CurrentValue     int64                     `json:"current_value" example:"98"`
	LimitValue       int64                     `json:"limit_value" example:"100"`
	Blocked          bool                      `json:"blocked" example:"true"`
	CreatedAt        NullTime                  `json:"created_at" swaggertype:"integer" example:"1682366228"`
}

func (wlt *WorkspaceLimitTrigger) BeforeCreate(_ *gorm.DB) (err error) {
	if !wlt.ID.Valid {
		wlt.ID = NewID()
	}
	return
}
