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

type Evaluator interface {
	Initialize(options interface{}) error
	Evaluate(cell string) (bool, error)
	DefaultMessage() string
	AllowedDataTypes() []string
}

func Parse(validate string, options jsonb.JSONB) (Evaluator, error) {
	var e Evaluator
	switch validate {
	case "not_blank":
		e = NotBlankEvaluator{}
	case "regex":
		e = RegexEvaluator{}
	default:
		return nil, fmt.Errorf("The validate type %s is invalid", validate)
	}
	err := e.Initialize(options.Data)
	if err != nil {
		return nil, fmt.Errorf("Invalid %s validate options: %s", validate, err.Error())
	}
	return e, nil
}
