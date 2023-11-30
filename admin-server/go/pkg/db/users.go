package db

import (
	"gorm.io/gorm"
)

// userPreloadArgs Used to remove unnecessary fields when preloading Users for our standard objects
// TODO: You can eventually change this so objects are attached to a lightweight version of the user object which doesn't join to roles
func userPreloadArgs(tx *gorm.DB) *gorm.DB {
	return tx.Omit("TimeJoined", "Role", "Recipe")
}
