package db

import (
	"errors"
	"gorm.io/gorm"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
)

func GetImportByUploadID(uploadID string) (*model.Import, error) {
	if len(uploadID) == 0 {
		return nil, errors.New("no upload ID provided")
	}
	var imp model.Import
	err := tf.DB.First(&imp, "upload_id = ?", model.ParseID(uploadID)).Error
	if err != nil {
		return nil, err
	}
	if !imp.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &imp, nil
}

func GetImportByUploadIDWithUpload(uploadID string) (*model.Import, error) {
	if len(uploadID) == 0 {
		return nil, errors.New("no upload ID provided")
	}
	var imp model.Import
	err := tf.DB.Preload("Upload").First(&imp, "upload_id = ?", model.ParseID(uploadID)).Error
	if err != nil {
		return nil, err
	}
	if !imp.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &imp, nil
}

func DeleteImport(importID string) error {
	if len(importID) == 0 {
		return errors.New("no import ID provided")
	}
	err := tf.DB.Where("id = ?", model.ParseID(importID)).Delete(&model.Import{}).Error
	return err
}
