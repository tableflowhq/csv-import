package evaluator

type DateEvaluator struct{}

func (e *DateEvaluator) Initialize(_ interface{}) error {
	return nil
}

func (e DateEvaluator) Evaluate(cell string) (bool, string, error) {
	// TODO: *******
	return true, cell, nil
}

func (e DateEvaluator) DefaultMessage() string {
	return "The cell must be a date"
}

func (e DateEvaluator) AllowedDataTypes() []string {
	return []string{"date"}
}
