package model

type User struct {
	ID         ID     `json:"id" swaggertype:"string" example:"249ac073-0fe8-4705-82ff-73e3df491b04"`
	Email      string `json:"email" example:"test@example.com"`
	TimeJoined uint64 `json:"time_joined,omitempty" example:"1682366228"`
	Role       string `json:"role,omitempty" example:"user"`
	Recipe     string `json:"recipe,omitempty" example:"github"`
}
