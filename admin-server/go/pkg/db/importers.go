package db

import (
	"errors"
	"gorm.io/gorm"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
)

func GetImporter(id string) (*model.Importer, error) {
	if len(id) == 0 {
		return nil, errors.New("no importer ID provided")
	}
	var importer model.Importer
	err := tf.DB.Preload("Template.TemplateColumns.Validations").
		First(&importer, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !importer.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &importer, nil
}

func GetImporterUnscoped(id string) (*model.Importer, error) {
	if len(id) == 0 {
		return nil, errors.New("no importer ID provided")
	}
	var importer model.Importer
	err := tf.DB.Unscoped().
		Preload("Template", "templates.deleted_at is null").
		Preload("Template.TemplateColumns.Validations", "template_columns.deleted_at is null").
		First(&importer, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !importer.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &importer, nil
}

func GetImporterWithoutTemplate(id string) (*model.Importer, error) {
	if len(id) == 0 {
		return nil, errors.New("no importer ID provided")
	}
	var importer model.Importer
	err := tf.DB.First(&importer, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !importer.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &importer, nil
}

func GetImporterWithUsers(id string) (*model.Importer, error) {
	if len(id) == 0 {
		return nil, errors.New("no importer ID provided")
	}
	var importer model.Importer
	err := tf.DB.Preload("Template.TemplateColumns.Validations").
		Preload("CreatedByUser", userPreloadArgs).
		Preload("UpdatedByUser", userPreloadArgs).
		Preload("DeletedByUser", userPreloadArgs).
		First(&importer, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !importer.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &importer, nil
}

func GetImporters(workspaceID string) ([]*model.Importer, error) {
	if len(workspaceID) == 0 {
		return nil, errors.New("no workspace ID provided")
	}
	var importers []*model.Importer
	err := tf.DB.Preload("Template.TemplateColumns.Validations").
		Where("workspace_id = ?", workspaceID).
		Find(&importers).Error
	if err != nil {
		return nil, err
	}
	return importers, nil
}

func GetImportersWithUsers(workspaceID string) ([]*model.Importer, error) {
	if len(workspaceID) == 0 {
		return nil, errors.New("no workspace ID provided")
	}
	var importers []*model.Importer

	err := tf.DB.Preload("Template.TemplateColumns.Validations").
		Preload("CreatedByUser", userPreloadArgs).
		Preload("UpdatedByUser", userPreloadArgs).
		Preload("DeletedByUser", userPreloadArgs).
		Where("workspace_id = ?", workspaceID).
		Find(&importers).Error
	if err != nil {
		return nil, err
	}
	return importers, nil
}
