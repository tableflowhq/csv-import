package model

import (
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Importer struct {
	ID                     ID             `json:"id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	WorkspaceID            ID             `json:"workspace_id,omitempty" swaggertype:"string" example:"b2079476-261a-41fe-8019-46eb51c537f7"`
	Name                   string         `json:"name" example:"Test Importer"`
	AllowedDomains         pq.StringArray `json:"allowed_domains" gorm:"type:text[]" swaggertype:"array,string" example:"example.com"`
	WebhooksEnabled        bool           `json:"webhooks_enabled"  example:"true"`
	SkipHeaderRowSelection bool           `json:"skip_header_row_selection" example:"false"`
	CreatedBy              ID             `json:"-"`
	CreatedByUser          *User          `json:"created_by,omitempty" gorm:"foreignKey:ID;references:CreatedBy"`
	CreatedAt              NullTime       `json:"created_at" swaggertype:"integer" example:"1682366228"`
	UpdatedBy              ID             `json:"-"`
	UpdatedByUser          *User          `json:"updated_by,omitempty" gorm:"foreignKey:ID;references:UpdatedBy"`
	UpdatedAt              NullTime       `json:"updated_at" swaggertype:"integer" example:"1682366228"`
	DeletedBy              ID             `json:"-"`
	DeletedByUser          *User          `json:"-" gorm:"foreignKey:ID;references:DeletedBy"`
	DeletedAt              gorm.DeletedAt `json:"-"`

	Template *Template `json:"template,omitempty"`
}

func (i *Importer) BeforeCreate(_ *gorm.DB) (err error) {
	if !i.ID.Valid {
		i.ID = NewID()
	}
	if i.AllowedDomains == nil {
		i.AllowedDomains = pq.StringArray{}
	}
	return
}
