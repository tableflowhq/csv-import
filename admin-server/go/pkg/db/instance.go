package db

import "tableflow/go/pkg/tf"

func GetInstanceID() (string, error) {
	type Res struct {
		ID string
	}
	res := Res{}
	err := tf.DB.Raw("select id from instance_id").Scan(&res).Error
	return res.ID, err
}
