package evaluator

import (
	"github.com/asaskevich/govalidator"
	"tableflow/go/pkg/util"
)

type EmailEvaluator struct{}

func (e *EmailEvaluator) Initialize(_ interface{}) error {
	return nil
}

func (e EmailEvaluator) Evaluate(cell string) (bool, string, error) {
	if util.IsBlankUnicode(cell) {
		return false, "", nil
	}
	isEmail := govalidator.IsEmail(cell)
	return isEmail, cell, nil
}

func (e EmailEvaluator) DefaultMessage() string {
	return "The cell must be a valid email"
}

func (e EmailEvaluator) AllowedDataTypes() []string {
	return []string{"string"}
}
