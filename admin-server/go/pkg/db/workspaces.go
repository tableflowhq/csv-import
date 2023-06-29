package db

import (
	"errors"
	"tableflow/go/pkg/model"
)

func GetAPIKey(workspaceID string) (string, error) {
	if len(workspaceID) == 0 {
		return "", errors.New("no workspace ID provided")
	}
	type Res struct {
		APIKey string
	}
	var res Res
	err := DB.Raw("select api_key from workspaces where id = ?;", model.ParseID(workspaceID)).Scan(&res).Error
	if err != nil {
		return "", err
	}
	if len(res.APIKey) == 0 {
		return "", errors.New("not found")
	}
	return res.APIKey, err
}

func RegenerateAPIKey(workspaceID string) (string, error) {
	if len(workspaceID) == 0 {
		return "", errors.New("no workspace ID provided")
	}
	type Res struct {
		APIKey string
	}
	var res Res
	err := DB.Raw("update workspaces set api_key = concat('tf_', replace(gen_random_uuid()::text, '-', '')) where id = ? returning api_key;", model.ParseID(workspaceID)).Scan(&res).Error
	if err != nil {
		return "", err
	}
	if len(res.APIKey) == 0 {
		return "", errors.New("not found")
	}
	return res.APIKey, err
}

func GetWorkspaceIDFromAPIKey(apiKey string) (string, error) {
	if len(apiKey) == 0 {
		return "", errors.New("no API key provided")
	}
	type Res struct {
		ID string
	}
	var res Res
	err := DB.Raw("select id from workspaces where api_key = ?;", apiKey).Scan(&res).Error
	if err != nil {
		return "", err
	}
	if len(res.ID) == 0 {
		return "", errors.New("not found")
	}
	return res.ID, err
}
