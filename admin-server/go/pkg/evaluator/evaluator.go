package evaluator

import (
	"fmt"
	"tableflow/go/pkg/model/jsonb"
)

var allDataTypes = []string{
	"string",
	"number",
	"boolean",
	"date",
}

var dataTypesWithEvaluators = []string{
	"number",
	"boolean",
	"date",
}

type Evaluator interface {
	Initialize(options interface{}) error
	Evaluate(cell string) (bool, error)
	DefaultMessage() string
	AllowedDataTypes() []string
}

// TODO: Consider adding an "allow duplicate" flag so certain validations, i.e. not_blank, can only be added once

func Parse(validate string, options jsonb.JSONB) (Evaluator, error) {
	var e Evaluator
	switch validate {
	case "number":
		e = &NumberEvaluator{}
	case "boolean":
		e = &BooleanEvaluator{}
	case "date":
		e = &DateEvaluator{}
	case "not_blank":
		e = &NotBlankEvaluator{}
	case "regex":
		e = &RegexEvaluator{}
	default:
		return nil, fmt.Errorf("The validate type %s is invalid", validate)
	}
	err := e.Initialize(options.Data)
	if err != nil {
		return nil, fmt.Errorf("Invalid %s validate options: %s", validate, err.Error())
	}
	return e, nil
}

func IsDataTypeEvaluator(validate string) bool {
	for _, dataType := range dataTypesWithEvaluators {
		if dataType == validate {
			return true
		}
	}
	return false
}
