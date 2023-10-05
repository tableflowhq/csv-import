package evaluator

import "tableflow/go/pkg/util"

type BooleanEvaluator struct{}

func (e BooleanEvaluator) Initialize(_ interface{}) error {
	return nil
}

func (e BooleanEvaluator) Evaluate(cell string) (bool, error) {
	_, err := util.StringToBoolOrNil(cell)
	return err == nil, nil
}

func (e BooleanEvaluator) DefaultMessage() string {
	return "The cell must be a boolean value"
}

func (e BooleanEvaluator) AllowedDataTypes() []string {
	return []string{"boolean"}
}
