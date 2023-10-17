package evaluator

import (
	"github.com/samber/lo"
	"regexp"
	"strings"
	"tableflow/go/pkg/util"
)

type PhoneEvaluator struct{}

var phoneRegex = regexp.MustCompile(`^(\+\d{1,2}\s?)?1?-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$`)

func (e *PhoneEvaluator) Initialize(_ interface{}) error {
	return nil
}

func (e PhoneEvaluator) Evaluate(cell string) (bool, string, error) {
	if util.IsBlankUnicode(cell) {
		return false, "", nil
	}
	trimmed := strings.TrimSpace(cell)
	isPhone := phoneRegex.MatchString(trimmed)
	return isPhone, lo.Ternary(isPhone, trimmed, cell), nil
}

func (e PhoneEvaluator) DefaultMessage() string {
	return "The cell must be a valid phone number"
}

func (e PhoneEvaluator) AllowedDataTypes() []string {
	return []string{"string"}
}
