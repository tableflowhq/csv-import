package db

import (
	"errors"
	"gorm.io/gorm"
	"tableflow/go/pkg/model"
)

func GetImport(id string) (*model.Import, error) {
	if len(id) == 0 {
		return nil, errors.New("no import ID provided")
	}
	var imp model.Import
	err := DB.First(&imp, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !imp.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &imp, nil
}

func GetImportForAdminAPI(id string) (*model.Import, error) {
	if len(id) == 0 {
		return nil, errors.New("no import ID provided")
	}
	var imp model.Import
	err := DB.Omit("StorageBucket").
		First(&imp, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !imp.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &imp, nil
}
