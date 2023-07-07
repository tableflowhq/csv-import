package db

import (
	"errors"
	"gorm.io/gorm"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
)

// userPreloadArgs Used to remove unnecessary fields when preloading Users for our standard objects
// TODO: You can eventually change this so objects are attached to a lightweight version of the user object which doesn't join to roles
func userPreloadArgs(tx *gorm.DB) *gorm.DB {
	return tx.Omit("TimeJoined", "Role", "Recipe")
}

func GetUser(id string) (*model.User, error) {
	if len(id) == 0 {
		return nil, errors.New("no ID provided")
	}
	var user model.User
	err := tf.DB.First(&user, model.ParseID(id)).Error
	if err != nil {
		return nil, err
	}
	if !user.ID.Valid {
		return nil, gorm.ErrRecordNotFound
	}
	return &user, nil
}

func GetUsers() ([]*model.User, error) {
	var users []*model.User
	err := tf.DB.Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func IsUserInWorkspace(workspaceID, userID string) (bool, error) {
	if len(userID) == 0 {
		return false, errors.New("no user ID provided")
	}
	if len(workspaceID) == 0 {
		return false, errors.New("no workspace ID provided")
	}
	type Res struct {
		Exists bool
	}
	var res Res
	err := tf.DB.Raw("select exists(select 1 from workspace_users where workspace_id = ? and user_id = ?);", workspaceID, userID).Scan(&res).Error
	return res.Exists, err
}
