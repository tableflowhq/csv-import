package evaluator

import (
	"github.com/araddon/dateparse"
	"time"
)

type DateEvaluator struct{}

func (e *DateEvaluator) Initialize(_ interface{}) error {
	return nil
}

func (e DateEvaluator) Evaluate(cell string) (bool, string, error) {
	t, err := dateparse.ParseAny(cell)
	if err != nil {
		return false, cell, nil
	}
	return true, t.Format(time.RFC3339), nil
}

func (e DateEvaluator) DefaultMessage() string {
	return "The cell must be a date"
}

func (e DateEvaluator) AllowedDataTypes() []string {
	return []string{"date"}
}
