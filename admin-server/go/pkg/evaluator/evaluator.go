package evaluator

import (
	"errors"
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
	Evaluate(cell string) (passed bool, value string, err error)
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
	case "email":
		e = &EmailEvaluator{}
	case "phone":
		e = &PhoneEvaluator{}
	case "length":
		e = &LengthEvaluator{}
	case "range":
		e = &RangeEvaluator{}
	case "list":
		e = &ListEvaluator{}
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

type MinMaxEvaluatorOptions struct {
	Min *int `json:"min"`
	Max *int `json:"max"`
}

func parseMinMaxOptions(options interface{}, limit int) (*MinMaxEvaluatorOptions, error) {
	if options == nil {
		return nil, errors.New("not provided")
	}

	optionsMap, ok := options.(map[string]interface{})
	if !ok {
		return nil, errors.New("invalid object")
	}

	var minMaxOptions MinMaxEvaluatorOptions

	for key, value := range optionsMap {
		var intValue int
		switch v := value.(type) {
		case float64:
			intValue = int(v)
		case int:
			intValue = v
		default:
			continue
		}
		if key == "min" {
			minMaxOptions.Min = &intValue
		} else if key == "max" {
			minMaxOptions.Max = &intValue
		}
	}

	if minMaxOptions.Min == nil && minMaxOptions.Max == nil {
		return nil, errors.New("min and/or max are required")
	}
	if *minMaxOptions.Min < 0 {
		return nil, errors.New("min must be positive")
	}
	if *minMaxOptions.Max < 0 {
		return nil, errors.New("max must be positive")
	}
	if limit > 0 {
		if *minMaxOptions.Min > limit {
			return nil, fmt.Errorf("min cannot be greater than %v", limit)
		}
		if *minMaxOptions.Max > limit {
			return nil, fmt.Errorf("max cannot be greater than %v", limit)
		}
	}
	if *minMaxOptions.Min > *minMaxOptions.Max {
		return nil, errors.New("min cannot be greater than the max")
	}

	return &minMaxOptions, nil
}
