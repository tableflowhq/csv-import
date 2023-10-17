package evaluator

import (
	"errors"
	"fmt"
	"strings"
	"tableflow/go/pkg/util"
)

type ListEvaluator struct {
	Options        []string
	DefaultMessage string
}

func (e *ListEvaluator) Initialize(options interface{}) error {
	if options == nil {
		return errors.New("not provided")
	}

	opts, ok := options.([]string)
	if !ok {
		return errors.New("must be an array of strings")
	}

	if len(opts) == 0 {
		return errors.New("no list values provided")
	}

	// Remove duplicates and blank values, convert to lowercase and trim
	parsedOptions := make([]string, 0, len(opts))
	keys := make(map[string]bool)
	for _, entry := range opts {
		if _, contains := keys[entry]; !contains && !util.IsBlankUnicode(entry) {
			parsed := strings.ToLower(strings.TrimSpace(entry))
			keys[parsed] = true
			parsedOptions = append(parsedOptions, parsed)
		}
	}

	if len(parsedOptions) == 0 {
		return errors.New("no non-blank list values provided")
	}

	e.Options = parsedOptions
	e.DefaultMessage = parseDefaultMessage(parsedOptions)
	return nil
}

func (e ListEvaluator) Evaluate(cell string) (bool, string, error) {
	if len(e.Options) == 0 {
		return false, cell, errors.New("uninitialized list evaluator")
	}
	trimmed := strings.TrimSpace(cell)
	lower := strings.ToLower(trimmed)
	for _, option := range e.Options {
		if lower == option {
			return true, trimmed, nil
		}
	}
	return false, cell, nil
}

func (e ListEvaluator) DefaultMessage() string {
	return e.DefaultMessage
}

func (e ListEvaluator) AllowedDataTypes() []string {
	return []string{"string"}
}

func parseDefaultMessage(options []string) string {
	var quotedOptions []string
	for _, option := range options {
		quotedOptions = append(quotedOptions, fmt.Sprintf("'%s'", option))
	}
	if len(quotedOptions) > 2 {
		lastOption := quotedOptions[len(quotedOptions)-1]
		quotedOptions[len(quotedOptions)-1] = "or " + lastOption
		return fmt.Sprintf("The cell must be %s", strings.Join(quotedOptions, ", "))
	}
	if len(quotedOptions) == 2 {
		return fmt.Sprintf("The cell must be %s or %s", quotedOptions[0], quotedOptions[1])
	}
	return fmt.Sprintf("The cell must be '%s'", quotedOptions[0])
}
