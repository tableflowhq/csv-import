package evaluator

import (
	"tableflow/go/pkg/util"
)

type NotBlankEvaluator struct{}

func (e NotBlankEvaluator) Initialize(_ interface{}) error {
	return nil
}

func (e NotBlankEvaluator) Evaluate(cell string) (bool, error) {
	return !util.IsBlankUnicode(cell), nil
}

func (e NotBlankEvaluator) DefaultMessage() string {
	return "The cell must contain a value"
}

func (e NotBlankEvaluator) AllowedDataTypes() []string {
	return allDataTypes
}
