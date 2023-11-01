package evaluator

import (
	"errors"
	"fmt"
	"regexp"
)

type RegexEvaluator struct {
	Regexp *regexp.Regexp
}

func (e *RegexEvaluator) Initialize(options interface{}) error {
	if options == nil {
		return errors.New("no pattern provided")
	}
	pattern, ok := options.(string)
	if !ok {
		return errors.New("pattern must be a string")
	}
	if len(pattern) == 0 {
		return errors.New("no pattern provided")
	}
	var err error
	e.Regexp, err = regexp.Compile(pattern)
	if err != nil {
		return fmt.Errorf("invalid pattern: %v", err.Error())
	}
	return nil
}

func (e RegexEvaluator) Evaluate(cell string) (bool, string, error) {
	if e.Regexp == nil {
		return false, cell, errors.New("uninitialized regex evaluator")
	}
	return e.Regexp.MatchString(cell), cell, nil
}

func (e RegexEvaluator) DefaultMessage() string {
	message := "The cell must match the pattern"
	if e.Regexp == nil {
		return message
	}
	return fmt.Sprintf("%s %s", message, e.Regexp.String())
}

func (e RegexEvaluator) AllowedDataTypes() []string {
	return []string{"string"}
}
