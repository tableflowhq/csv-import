package db

import (
	"errors"
	"gorm.io/gorm"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
)

func GetTemplate(id string) (*model.Template, error) {
	if len(id) == 0 {
		return nil, errors.New("no ID provided")
	}
	var template model.Template
	err := tf.DB.Preload("TemplateColumns.Validations").
		First(&template, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !template.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &template, nil
}

func GetTemplateByTemplateColumnID(templateColumnID string) (*model.Template, error) {
	if len(templateColumnID) == 0 {
		return nil, errors.New("no template column ID provided")
	}
	var template model.Template
	err := tf.DB.Preload("TemplateColumns.Validations").
		Where("id = (select template_id from template_columns where id = ? and deleted_at is null)", model.ParseID(templateColumnID)).
		First(&template).Error
	if err != nil {
		return nil, err
	}
	if !template.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &template, nil
}

func GetTemplateWithUsers(id string) (*model.Template, error) {
	if len(id) == 0 {
		return nil, errors.New("no ID provided")
	}
	var template model.Template
	err := tf.DB.Preload("TemplateColumns.Validations").
		Preload("CreatedByUser", userPreloadArgs).
		Preload("UpdatedByUser", userPreloadArgs).
		Preload("DeletedByUser", userPreloadArgs).
		First(&template, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !template.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &template, nil
}

func GetTemplateByImporter(importerID string) (*model.Template, error) {
	if len(importerID) == 0 {
		return nil, errors.New("no importer ID provided")
	}
	var template model.Template
	err := tf.DB.Preload("TemplateColumns.Validations").
		First(&template, "importer_id = ?", model.ParseID(importerID)).Error
	if err != nil {
		return nil, err
	}
	if !template.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &template, nil
}

func GetTemplateByImporterWithImporter(importerID string) (*model.Template, error) {
	if len(importerID) == 0 {
		return nil, errors.New("no importer ID provided")
	}
	var template model.Template
	err := tf.DB.Preload("TemplateColumns.Validations").
		Preload("Importer").
		First(&template, "importer_id = ?", model.ParseID(importerID)).Error
	if err != nil {
		return nil, err
	}
	if !template.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &template, nil
}

func GetTemplateColumn(id string) (*model.TemplateColumn, error) {
	if len(id) == 0 {
		return nil, errors.New("no ID provided")
	}
	var templateColumn model.TemplateColumn
	err := tf.DB.Preload("Validations").
		First(&templateColumn, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !templateColumn.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &templateColumn, nil
}
