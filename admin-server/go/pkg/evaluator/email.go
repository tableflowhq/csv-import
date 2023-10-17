package evaluator

import (
	"github.com/asaskevich/govalidator"
	"github.com/samber/lo"
	"strings"
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
	trimmed := strings.TrimSpace(cell)
	isEmail := govalidator.IsEmail(trimmed)
	return isEmail, lo.Ternary(isEmail, trimmed, cell), nil
}

func (e EmailEvaluator) DefaultMessage() string {
	return "The cell must be a valid email"
}

func (e EmailEvaluator) AllowedDataTypes() []string {
	return []string{"string"}
}
