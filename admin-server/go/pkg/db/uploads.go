package db

import (
	"errors"
	"fmt"
	"gorm.io/gorm"
	"strings"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
)

func GetUpload(id string) (*model.Upload, error) {
	if len(id) == 0 {
		return nil, errors.New("no ID provided")
	}
	var upload model.Upload
	err := tf.DB.Preload("UploadColumns").First(&upload, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !upload.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &upload, nil
}

func IsUploadStored(id string) (bool, error) {
	if len(id) == 0 {
		return false, errors.New("no ID provided")
	}
	type Res struct {
		IsStored bool
	}
	var res Res
	err := tf.DB.Raw("select is_stored from uploads where id = ?;", id).Scan(&res).Error
	return res.IsStored, err
}

func GetUploadByTusID(tusID string) (*model.Upload, error) {
	if len(tusID) == 0 {
		return nil, errors.New("no Tus ID provided")
	}
	var upload model.Upload
	err := tf.DB.First(&upload, "tus_id = ?", tusID).Error
	if err != nil {
		return nil, err
	}
	if !upload.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	if upload.IsStored {
		// If the upload has been stored, retrieve the upload columns as well
		var uploadColumns []*model.UploadColumn
		tf.DB.Where("upload_id = ?", upload.ID).Find(&uploadColumns)
		upload.UploadColumns = uploadColumns
	}
	return &upload, nil
}

func SetTemplateColumnIDs(upload *model.Upload, columnMapping map[string]string) error {
	numParams := len(columnMapping)
	valuesStmt := make([]string, numParams, numParams)
	values := make([]interface{}, numParams*2, numParams*2)
	var si, vi int
	for uploadColumnID, templateColumnID := range columnMapping {
		valuesStmt[si] = "(?::uuid, ?::uuid)"
		si++
		values[vi] = uploadColumnID
		values[vi+1] = templateColumnID
		vi += 2
	}
	sql := fmt.Sprintf(`
		update upload_columns as uc
			set template_column_id = map.template_column_id
			from (values %s) as map(upload_column_id, template_column_id)
		where map.upload_column_id = uc.id;`,
		strings.Join(valuesStmt, ","))
	err := tf.DB.Exec(sql, values...).Error
	if err == nil {
		// Set the template column IDs on the upload columns
		for i, _ := range upload.UploadColumns {
			uc := upload.UploadColumns[i]
			if tcID, has := columnMapping[uc.ID.String()]; has {
				uc.TemplateColumnID = model.ParseID(tcID)
			}
		}
	}
	return err
}
