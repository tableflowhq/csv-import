package db

import (
	"errors"
	"fmt"
	"gorm.io/gorm"
	"strings"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
)

func GetTemplate(id string) (*model.Template, error) {
	if len(id) == 0 {
		return nil, errors.New("no ID provided")
	}
	var template model.Template
	err := tf.DB.Preload("TemplateColumns", func(db *gorm.DB) *gorm.DB {
		return db.Order("template_columns.index asc").Preload("Validations")
	}).First(&template, model.ParseID(id)).Error
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
	err := tf.DB.Preload("TemplateColumns", func(db *gorm.DB) *gorm.DB {
		return db.Order("template_columns.index asc").Preload("Validations")
	}).Where("id = (select template_id from template_columns where id = ? and deleted_at is null)", model.ParseID(templateColumnID)).
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
	err := tf.DB.Preload("TemplateColumns", func(db *gorm.DB) *gorm.DB {
		return db.Order("template_columns.index asc").Preload("Validations")
	}).
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
	err := tf.DB.Preload("TemplateColumns", func(db *gorm.DB) *gorm.DB {
		return db.Order("template_columns.index asc").Preload("Validations")
	}).First(&template, "importer_id = ?", model.ParseID(importerID)).Error
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
	err := tf.DB.Preload("TemplateColumns", func(db *gorm.DB) *gorm.DB {
		return db.Order("template_columns.index asc").Preload("Validations")
	}).
		Preload("Importer.Workspace").
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

func UpdateTemplateColumnIndexes(template *model.Template) error {
	if template == nil {
		return errors.New("no template provided")
	}

	var sqlBuilder strings.Builder
	sqlBuilder.WriteString("update template_columns set index = new_index from (values ")

	valueStrings := []string{}
	valueArgs := []interface{}{}

	for i, column := range template.TemplateColumns {
		valueStrings = append(valueStrings, fmt.Sprintf("($%d::uuid, $%d::integer)", len(valueArgs)+1, len(valueArgs)+2))
		valueArgs = append(valueArgs, column.ID, i)
	}

	sqlBuilder.WriteString(strings.Join(valueStrings, ", "))
	sqlBuilder.WriteString(") as updates(id, new_index) where template_columns.id = updates.id")

	err := tf.DB.Exec(sqlBuilder.String(), valueArgs...).Error
	if err != nil {
		return err
	}
	return nil
}
