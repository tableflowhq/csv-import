package model

import (
	"gorm.io/gorm"
)

type Workspace struct {
	ID             ID             `json:"id" swaggertype:"string" example:"b2079476-261a-41fe-8019-46eb51c537f7"`
	OrganizationID ID             `json:"-"`
	APIKey         string         `json:"-" swaggerignore:"true" gorm:"default:concat('tf_', replace(gen_random_uuid()::text, '-', ''))"`
	Name           string         `json:"name" example:"My Workspace"`
	CreatedBy      ID             `json:"-"`
	CreatedByUser  *User          `json:"created_by,omitempty" gorm:"foreignKey:ID;references:CreatedBy"`
	CreatedAt      NullTime       `json:"created_at" swaggertype:"integer" example:"1682366228"`
	UpdatedBy      ID             `json:"-"`
	UpdatedByUser  *User          `json:"updated_by,omitempty" gorm:"foreignKey:ID;references:UpdatedBy"`
	UpdatedAt      NullTime       `json:"updated_at" swaggertype:"integer" example:"1682366228"`
	DeletedBy      ID             `json:"-"`
	DeletedByUser  *User          `json:"-" gorm:"foreignKey:ID;references:DeletedBy"`
	DeletedAt      gorm.DeletedAt `json:"-"`

	Organization *Organization `json:"organization,omitempty" swaggerignore:"true" gorm:"foreignKey:ID;references:OrganizationID"`
	Users        []*User       `json:"users,omitempty" gorm:"many2many:workspace_users;"`
}

func (w *Workspace) BeforeCreate(_ *gorm.DB) (err error) {
	if !w.ID.Valid {
		w.ID = NewID()
	}
	return
}
