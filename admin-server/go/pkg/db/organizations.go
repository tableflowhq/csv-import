package db

import (
	"errors"
	"gorm.io/gorm"
	"tableflow/go/pkg/model"
)

func GetOrganizationOfUserWithWorkspaces(userID string) (*model.Organization, error) {
	if len(userID) == 0 {
		return nil, errors.New("no user ID provided")
	}
	var organization model.Organization
	err := DB.Preload("Workspaces").
		Where("id in (select organization_id from organization_users where user_id = ?)", model.ParseID(userID)).
		First(&organization).Error
	if err != nil {
		return nil, err
	}
	if !organization.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &organization, nil
}
