package model

import (
	"gorm.io/gorm"
)

type Template struct {
	ID            ID             `json:"id" swaggertype:"string" example:"f0797968-becc-422a-b135-19de1d8c5d46"`
	WorkspaceID   ID             `json:"workspace_id,omitempty" swaggertype:"string" example:"b2079476-261a-41fe-8019-46eb51c537f7"`
	ImporterID    ID             `json:"importer_id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	Name          string         `json:"name" example:"My Template"`
	CreatedBy     ID             `json:"-"`
	CreatedByUser *User          `json:"created_by,omitempty" gorm:"foreignKey:ID;references:CreatedBy"`
	CreatedAt     NullTime       `json:"created_at" swaggertype:"integer" example:"1682366228"`
	UpdatedBy     ID             `json:"-"`
	UpdatedByUser *User          `json:"updated_by,omitempty" gorm:"foreignKey:ID;references:UpdatedBy"`
	UpdatedAt     NullTime       `json:"updated_at" swaggertype:"integer" example:"1682366228"`
	DeletedBy     ID             `json:"-"`
	DeletedByUser *User          `json:"-" gorm:"foreignKey:ID;references:DeletedBy"`
	DeletedAt     gorm.DeletedAt `json:"-"`

	TemplateColumns []*TemplateColumn `json:"template_columns"`
	Importer        *Importer         `json:"importer,omitempty" swaggerignore:"true" gorm:"foreignKey:ID;references:ImporterID"`
}

func (t *Template) BeforeCreate(_ *gorm.DB) (err error) {
	if !t.ID.Valid {
		t.ID = NewID()
	}
	return
}
