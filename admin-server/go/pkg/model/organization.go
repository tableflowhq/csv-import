package model

import "gorm.io/gorm"

type Organization struct {
	ID            ID             `json:"id" swaggertype:"string" example:"8a7850a1-8b03-4337-a530-f9d48f7d9232"`
	Name          string         `json:"name" example:"My Organization"`
	CreatedBy     ID             `json:"-"`
	CreatedByUser *User          `json:"created_by,omitempty" gorm:"foreignKey:ID;references:CreatedBy"`
	CreatedAt     NullTime       `json:"created_at" swaggertype:"integer" example:"1682366228"`
	UpdatedBy     ID             `json:"-"`
	UpdatedByUser *User          `json:"updated_by,omitempty" gorm:"foreignKey:ID;references:UpdatedBy"`
	UpdatedAt     NullTime       `json:"updated_at" swaggertype:"integer" example:"1682366228"`
	DeletedBy     ID             `json:"-"`
	DeletedByUser *User          `json:"-" gorm:"foreignKey:ID;references:DeletedBy"`
	DeletedAt     gorm.DeletedAt `json:"-"`

	Workspaces []*Workspace `json:"workspaces,omitempty"`
	Users      []*User      `json:"users,omitempty" gorm:"many2many:organization_users;"`
}

func (o *Organization) BeforeCreate(_ *gorm.DB) (err error) {
	if !o.ID.Valid {
		o.ID = NewID()
	}
	return
}
