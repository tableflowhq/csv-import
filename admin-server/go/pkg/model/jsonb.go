package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

// JSONB type
type JSONB map[string]interface{}

func JSONStringToJSONB(jsonStr string) (JSONB, error) {
	res := make(map[string]interface{})
	err := json.Unmarshal([]byte(jsonStr), &res)
	return res, err
}

// Value to save jsonb in Postgres
func (j JSONB) Value() (driver.Value, error) {
	res, err := json.Marshal(j)
	return string(res), err
}

// Scan unmarshal data to JSONB map
func (j *JSONB) Scan(src interface{}) error {
	var source []byte
	m := make(map[string]interface{})
	switch src.(type) {
	case []uint8:
		source = src.([]uint8)
	case string:
		source = []byte(src.(string))
	case nil:
		return nil
	default:
		return errors.New("incompatible type")
	}
	err := json.Unmarshal(source, &m)
	if err != nil {
		return err
	}
	*j = m
	return nil
}
