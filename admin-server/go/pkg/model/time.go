package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type NullTime struct {
	Time  time.Time
	Valid bool // Valid is true if Time is not NULL
}

// Scan implements the Scanner interface.
func (nt *NullTime) Scan(value interface{}) error {
	nt.Time, nt.Valid = value.(time.Time)
	return nil
}

// Value implements the driver Valuer interface.
func (nt NullTime) Value() (driver.Value, error) {
	if !nt.Valid {
		return nil, nil
	}
	return nt.Time, nil
}

func (nt NullTime) MarshalJSON() ([]byte, error) {
	if nt.Valid {
		unix := nt.Time.Unix()
		return json.Marshal(&unix)
	}
	return []byte("null"), nil
}

func (nt *NullTime) UnmarshalJSON(data []byte) error {
	var v interface{}
	err := json.Unmarshal(data, &v)
	if err != nil {
		return err
	}
	switch v.(type) {
	case float64:
		nt.Time = time.Unix(int64(v.(float64)), 0)
		nt.Valid = true
	}
	return nil
}
