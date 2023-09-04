package model

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"tableflow/go/pkg/model/evaluator"
)

type Evaluator interface {
	Evaluate(value interface{}, cell string) (bool, error)
	TypeCheck(value interface{}) error
}

type ValidationType struct {
	Type      string    `json:"type" example:"regex"`
	Evaluator Evaluator `json:"-"`
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
	// Set the Evaluator from the string type field
	switch typeStr {
	case ValidationFilled.Type:
		*v = ValidationFilled
	case ValidationRegex.Type:
		*v = ValidationRegex
	default:
		return fmt.Errorf("unknown ValidationType: %s", typeStr)
	}
	return nil
}

func (v ValidationType) Value() (driver.Value, error) {
	return v.Type, nil
}
