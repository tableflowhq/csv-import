package evaluator

import (
	"errors"
	"fmt"
)

type LengthEvaluator struct {
	Options *MinMaxEvaluatorOptions
}

func (e *LengthEvaluator) Initialize(options interface{}) error {
	minMaxOptions, err := parseMinMaxOptions(options)
	if err != nil {
		return err
	}
	e.Options = minMaxOptions
	return nil
}

func (e *LengthEvaluator) Evaluate(cell string) (bool, string, error) {
	if e.Options == nil {
		return false, cell, errors.New("uninitialized length evaluator")
	}
	length := len(cell)
	if e.Options.Min != nil && length < *e.Options.Min {
		return false, cell, nil
	}
	if e.Options.Max != nil && length > *e.Options.Max {
		return false, cell, nil
	}
	return true, cell, nil
}

func (e LengthEvaluator) DefaultMessage() string {
	minMsg, maxMsg := "", ""
	if e.Options.Min != nil {
		minMsg = fmt.Sprintf("minimum length of %d", *e.Options.Min)
	}
	if e.Options.Max != nil {
		maxMsg = fmt.Sprintf("maximum length of %d", *e.Options.Max)
	}

	switch {
	case minMsg != "" && maxMsg != "":
		return fmt.Sprintf("The cell must have a %s and a %s", minMsg, maxMsg)
	case minMsg != "":
		return fmt.Sprintf("The cell must have a %s", minMsg)
	case maxMsg != "":
		return fmt.Sprintf("The cell must have a %s", maxMsg)
	default:
		// This shouldn't happen
		return "The cell length must be within range"
	}
}

func (e LengthEvaluator) AllowedDataTypes() []string {
	return []string{"string"}
}
