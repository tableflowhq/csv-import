package evaluator

import (
	"errors"
	"fmt"
	"math/big"
	"tableflow/go/pkg/util"
)

type RangeEvaluator struct {
	Options *MinMaxEvaluatorOptions
}

func (e *RangeEvaluator) Initialize(options interface{}) error {
	minMaxOptions, err := parseMinMaxOptions(options, 0)
	if err != nil {
		return err
	}
	e.Options = minMaxOptions
	return nil
}

func (e *RangeEvaluator) Evaluate(cell string) (bool, string, error) {
	if e.Options == nil {
		return false, cell, errors.New("uninitialized range evaluator")
	}

	cellFloat, ok := util.StringToBigFloat(cell)
	if !ok {
		return false, cell, errors.New("invalid number")
	}

	// TODO: Consider storing min and max options as big.Float
	if e.Options.Min != nil {
		min := new(big.Float).SetInt64(int64(*e.Options.Min))
		if cellFloat.Cmp(min) < 0 {
			return false, cell, nil
		}
	}
	if e.Options.Max != nil {
		max := new(big.Float).SetInt64(int64(*e.Options.Max))
		if cellFloat.Cmp(max) > 0 {
			return false, cell, nil
		}
	}
	return true, cell, nil
}

func (e RangeEvaluator) DefaultMessage() string {
	minMsg, maxMsg := "", ""

	if e.Options.Min != nil && e.Options.Max != nil && *e.Options.Min == *e.Options.Max {
		return fmt.Sprintf("The value must equal %d", *e.Options.Min)
	}
	if e.Options.Min != nil {
		minMsg = fmt.Sprintf("greater than or equal to %d", *e.Options.Min)
	}
	if e.Options.Max != nil {
		maxMsg = fmt.Sprintf("less than or equal to %d", *e.Options.Max)
	}

	switch {
	case minMsg != "" && maxMsg != "":
		return fmt.Sprintf("The value must be %s and %s", minMsg, maxMsg)
	case minMsg != "":
		return fmt.Sprintf("The value must be %s", minMsg)
	case maxMsg != "":
		return fmt.Sprintf("The value must be %s", maxMsg)
	default:
		// This shouldn't happen
		return "The value must be within range"
	}
}

func (e RangeEvaluator) AllowedDataTypes() []string {
	return []string{"number"}
}
