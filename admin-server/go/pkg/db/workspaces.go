package db

import (
	"errors"
	"gorm.io/gorm"
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

func GetWorkspaceLimit(workspaceID string) (*model.WorkspaceLimit, error) {
	if len(workspaceID) == 0 {
		return nil, errors.New("no workspace ID provided")
	}
	var workspaceLimit model.WorkspaceLimit
	err := DB.First(&workspaceLimit, "workspace_id = ?", model.ParseID(workspaceID)).Error
	if err != nil {
		return nil, err
	}
	if !workspaceLimit.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &workspaceLimit, nil
}

func GetWorkspaceUsageCurrentMonth(workspaceID string) (*model.WorkspaceUsage, error) {
	if len(workspaceID) == 0 {
		return nil, errors.New("no workspace ID provided")
	}
	var workspaceUsage model.WorkspaceUsage
	err := DB.Raw(`
			with
			    current_month as (
			        select date_trunc('month', current_date) as month
			    )
			select to_char(month, 'yyyy-mm-dd')                               as month
			     , workspace_id
			     , count(imports.id)                                          as num_files
			     , coalesce(sum(num_rows), 0)                                 as num_rows
			     , coalesce(sum(num_processed_values), 0)                     as num_processed_values
			     , coalesce(sum(file_size::decimal / 1000 / 1000)::float4, 0) as total_file_size_mb
			from current_month
			     left join imports
			               on workspace_id = ?
			                   and created_at >= month
			group by month, workspace_id;
		`, model.ParseID(workspaceID)).Scan(&workspaceUsage).Error
	if err != nil {
		return nil, err
	}
	if len(workspaceUsage.WorkspaceID) == 0 {
		workspaceUsage.WorkspaceID = workspaceID
	}
	return &workspaceUsage, nil
}
