package model

type Role struct {
	Name        string   `json:"name" example:"user"`
	Permissions []string `json:"permissions" example:"changes_read,changes_create"`
}
