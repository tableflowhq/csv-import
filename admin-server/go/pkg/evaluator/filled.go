package evaluator

import (
	"fmt"
	"tableflow/go/pkg/util"
)

type FilledEvaluator struct{}

func (e FilledEvaluator) TypeCheck(value interface{}) error {
	_, ok := value.(bool)
	if !ok {
		return fmt.Errorf("invalid type, expected bool: %v", value)
	}
	return nil
}

func (e FilledEvaluator) Evaluate(value interface{}, cell string) (bool, error) {
	if err := e.TypeCheck(value); err != nil {
		return false, err
	}
	// A value of true (the default value) means the cell must be filled
	return !util.IsBlankUnicode(cell) == value.(bool), nil
}
