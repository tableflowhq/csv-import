package evaluator

import (
	"fmt"
	"regexp"
)

type RegexEvaluator struct{}

func (e RegexEvaluator) TypeCheck(value interface{}) error {
	_, ok := value.(string)
	if !ok {
		return fmt.Errorf("invalid type, expected string: %v", value)
	}
	return nil
}

func (e RegexEvaluator) Evaluate(value interface{}, cell string) (bool, error) {
	if err := e.TypeCheck(value); err != nil {
		return false, err
	}
	// TODO: Look at higher-performance regex packages. re-2?
	matched, err := regexp.MatchString(value.(string), cell)
	if err != nil {
		return false, err
	}
	return matched, nil
}
