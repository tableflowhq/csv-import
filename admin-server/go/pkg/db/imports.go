package db

import (
	"errors"
	"gorm.io/gorm"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
)

func GetImport(id string) (*model.Import, error) {
	if len(id) == 0 {
		return nil, errors.New("no import ID provided")
	}
	var imp model.Import
	err := tf.DB.First(&imp, model.ParseID(id)).Error
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
	err := tf.DB.First(&imp, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !imp.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &imp, nil
}

func GetImportsForAdminAPI(workspaceID string) ([]*model.Import, error) {
	if len(workspaceID) == 0 {
		return nil, errors.New("no workspace ID provided")
	}
	var imports []*model.Import
	// Use .Unscoped to load imports that are attached to a deleted importer
	err := tf.DB.Unscoped().
		Preload("Importer").
		Where("workspace_id = ?", model.ParseID(workspaceID)).
		Order("created_at desc").
		Find(&imports).Error
	if err != nil {
		return nil, err
	}
	return imports, nil
}

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

func DoesImportExistByUploadID(uploadID string) (bool, error) {
	if len(uploadID) == 0 {
		return false, errors.New("no upload ID provided")
	}
	type Res struct {
		Exists bool
	}
	var res Res
	err := tf.DB.Raw("select exists(select 1 from imports where upload_id = ?);", model.ParseID(uploadID)).Scan(&res).Error
	return res.Exists, err
}
