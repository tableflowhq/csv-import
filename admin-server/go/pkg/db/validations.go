package db

import (
	"errors"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
)

// GetValidationsMapForImporterUnscoped retrieves all validations attached to an importer's template. Note that this
// allows for validations, template columns, and templates being deleted as they could be deleted while a user is
// performing an import. This would cause the validation ID stored with Scylla to be invalid, so any deleted validations
// will remain in use until the import is complete.
func GetValidationsMapForImporterUnscoped(importerID string) (map[uint]model.Validation, error) {
	if len(importerID) == 0 {
		return nil, errors.New("no importer ID provided")
	}
	validationsMap := make(map[uint]model.Validation)
	var validations []model.Validation
	err := tf.DB.Raw(`
		select distinct on (v.id) v.*
		from validations v
		     join template_columns tc on v.template_column_id = tc.id
		     join templates t on tc.template_id = t.id
		where t.importer_id = ?;
	`, importerID).Scan(&validations).Error

	if err != nil {
		return nil, err
	}
	for _, v := range validations {
		validationsMap[v.ID] = v
	}
	return validationsMap, nil
}
