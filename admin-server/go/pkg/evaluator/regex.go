package evaluator

import (
	"errors"
	"fmt"
	"regexp"
)

type RegexEvaluator struct {
	Regexp *regexp.Regexp
}

func (e RegexEvaluator) Initialize(options interface{}) error {
	if options == nil {
		return errors.New("not provided")
	}
	pattern, ok := options.(string)
	if !ok {
		return errors.New("must be a string")
	}
	var err error
	e.Regexp, err = regexp.Compile(pattern)
	if err != nil {
		return fmt.Errorf("invalid pattern: %v", err.Error())
	}
	return nil
}

func (e RegexEvaluator) Evaluate(cell string) (bool, error) {
	if e.Regexp == nil {
		return false, errors.New("uninitialized regex evaluator")
	}
	return e.Regexp.MatchString(cell), nil
}

func (e RegexEvaluator) DefaultMessage() string {
	message := "The cell must match the pattern"
	if e.Regexp == nil {
		return message
	}
	return fmt.Sprintf("%s %s", message, e.Regexp.String())
}
