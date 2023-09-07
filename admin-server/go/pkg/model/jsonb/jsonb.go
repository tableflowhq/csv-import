package jsonb

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type JSONB struct {
	Data  interface{}
	Valid bool // Valid is false if Data is NULL
}

func NewEmpty() JSONB {
	return JSONB{
		Data:  map[string]interface{}{},
		Valid: true,
	}
}

func NewNull() JSONB {
	return JSONB{
		Data:  nil,
		Valid: false,
	}
}

func FromBytes(jsonBytes []byte) (JSONB, error) {
	return FromString(string(jsonBytes))
}

func FromString(jsonStr string) (JSONB, error) {
	var res interface{}
	if len(jsonStr) == 0 {
		return JSONB{Data: res, Valid: false}, nil
	}
	err := json.Unmarshal([]byte(jsonStr), &res)
	return JSONB{Data: res, Valid: err == nil}, err
}

func FromMap(dataMap map[string]interface{}) JSONB {
	return JSONB{
		Data:  dataMap,
		Valid: dataMap != nil,
	}
}

func (j JSONB) ToString() string {
	if !j.Valid {
		return "null"
	}
	jsonBytes, err := json.Marshal(j.Data)
	if err != nil {
		return "marshal_error"
	}
	return string(jsonBytes)
}

func (j JSONB) MarshalJSON() ([]byte, error) {
	if j.Valid {
		return json.Marshal(j.Data)
	}
	return json.Marshal(nil)
}

func (j *JSONB) UnmarshalJSON(data []byte) error {
	var tmp interface{}
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	j.Data = tmp
	j.Valid = tmp != nil
	return nil
}

// Value to save jsonb in Postgres
func (j JSONB) Value() (driver.Value, error) {
	if !j.Valid {
		return nil, nil
	}
	res, err := json.Marshal(j.Data)
	if err != nil {
		return nil, err
	}
	return string(res), nil
}

// Scan unmarshal data to JSONB
func (j *JSONB) Scan(src interface{}) error {
	if src == nil {
		j.Data, j.Valid = nil, false
		return nil
	}

	var source []byte
	switch src := src.(type) {
	case []uint8:
		source = src
	case string:
		source = []byte(src)
	default:
		return errors.New("incompatible type")
	}

	var res interface{}
	if err := json.Unmarshal(source, &res); err != nil {
		return err
	}
	j.Data, j.Valid = res, res != nil
	return nil
}

func (j JSONB) AsMap() (map[string]interface{}, bool) {
	if !j.Valid {
		return nil, false
	}
	dataMap, ok := j.Data.(map[string]interface{})
	return dataMap, ok
}

func (JSONB) GormDataType() string {
	return "jsonb"
}
