package model

import (
	"github.com/guregu/null"
	"github.com/lib/pq"
	"gorm.io/gorm"
	"regexp"
)

type TemplateColumn struct {
	ID                ID             `json:"id" swaggertype:"string" example:"a1ed136d-33ce-4b7e-a7a4-8a5ccfe54cd5"`
	TemplateID        ID             `json:"template_id" swaggertype:"string" example:"f0797968-becc-422a-b135-19de1d8c5d46"`
	Name              string         `json:"name" example:"Email"`
	Key               string         `json:"key" example:"email"`
	Required          bool           `json:"required" example:"false"`
	Description       null.String    `json:"description" swaggertype:"string" example:"An email address"`
	SuggestedMappings pq.StringArray `json:"suggested_mappings" gorm:"type:text[]" swaggertype:"array,string" example:"first_name"`
	CreatedBy         ID             `json:"-"`
	CreatedByUser     *User          `json:"created_by,omitempty" gorm:"foreignKey:ID;references:CreatedBy"`
	CreatedAt         NullTime       `json:"created_at" swaggertype:"integer" example:"1682366228"`
	UpdatedBy         ID             `json:"-"`
	UpdatedByUser     *User          `json:"updated_by,omitempty" gorm:"foreignKey:ID;references:UpdatedBy"`
	UpdatedAt         NullTime       `json:"updated_at" swaggertype:"integer" example:"1682366228"`
	DeletedBy         ID             `json:"-"`
	DeletedByUser     *User          `json:"-" gorm:"foreignKey:ID;references:DeletedBy"`
	DeletedAt         gorm.DeletedAt `json:"-"`

	Validations []*Validation `json:"validations"`
}

func (tc *TemplateColumn) BeforeCreate(_ *gorm.DB) (err error) {
	if !tc.ID.Valid {
		tc.ID = NewID()
	}
	if tc.SuggestedMappings == nil {
		tc.SuggestedMappings = pq.StringArray{}
	}
	return
}

func IsValidTemplateColumnKey(key string) bool {
	if len(key) == 0 {
		return false
	}
	// Match lowercase letters, numbers, and underscores
	pattern := "^[a-z0-9_]+$"
	match, _ := regexp.MatchString(pattern, key)
	return match
}
