package evaluator

import "fmt"

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
	return cell != "" == value.(bool), nil
}
