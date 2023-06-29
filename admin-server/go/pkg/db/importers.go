package db

import (
	"errors"
	"gorm.io/gorm"
	"tableflow/go/pkg/model"
)

func GetImporter(id string) (*model.Importer, error) {
	if len(id) == 0 {
		return nil, errors.New("no importer ID provided")
	}
	var importer model.Importer
	err := DB.Preload("Template.TemplateColumns").
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
	err := DB.First(&importer, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !importer.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &importer, nil
}
