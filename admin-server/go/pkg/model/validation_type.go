package model

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"tableflow/go/pkg/evaluator"
)

type ValidationType struct {
	Name      string              `json:"-" example:"regex"`
	Evaluator evaluator.Evaluator `json:"-"`
}

// Pre-defined ValidationTypes
var (
	ValidationFilled = ValidationType{"filled", evaluator.FilledEvaluator{}}
	ValidationRegex  = ValidationType{"regex", evaluator.RegexEvaluator{}}
)

func (v *ValidationType) Scan(value interface{}) error {
	// Convert the database value to a string
	typeStr, ok := value.(string)
	if !ok {
		return errors.New("failed to scan ValidationType")
	}
	// Set the Evaluator from the string type
	switch typeStr {
	case ValidationFilled.Name:
		*v = ValidationFilled
	case ValidationRegex.Name:
		*v = ValidationFilled
	default:
		return fmt.Errorf("The validation type %v is invalid", typeStr)
	}
	return nil
}

func (v ValidationType) Value() (driver.Value, error) {
	return v.Name, nil
}
