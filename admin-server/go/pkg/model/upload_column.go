package model

import (
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type UploadColumn struct {
	ID               ID             `json:"id" swaggertype:"string" example:"3c79e7fd-1018-4a27-8b86-9cee84221cd8"`
	UploadID         ID             `json:"upload_id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	Name             string         `json:"name" example:"Work Email"`
	Index            int            `json:"index" example:"0"`
	SampleData       pq.StringArray `json:"sample_data" gorm:"type:text[]" swaggertype:"array,string" example:"test@example.com"`
	TemplateColumnID ID             `json:"template_column_id" swaggertype:"string" example:"a1ed136d-33ce-4b7e-a7a4-8a5ccfe54cd5"`
}

func (uc *UploadColumn) BeforeCreate(_ *gorm.DB) (err error) {
	if !uc.ID.Valid {
		uc.ID = NewID()
	}
	if uc.SampleData == nil {
		uc.SampleData = pq.StringArray{}
	}
	return
}
