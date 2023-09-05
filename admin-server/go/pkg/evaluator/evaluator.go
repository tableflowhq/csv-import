package evaluator

type Evaluator interface {
	Evaluate(value interface{}, cell string) (bool, error)
	TypeCheck(value interface{}) error
}
