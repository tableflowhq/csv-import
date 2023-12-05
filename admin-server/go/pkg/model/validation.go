package model

import (
	"fmt"
	"github.com/samber/lo"
	"strings"
	"tableflow/go/pkg/evaluator"
	"tableflow/go/pkg/model/jsonb"
	"tableflow/go/pkg/tf"
)

type ValidationSeverity string

const (
	ValidationSeverityError ValidationSeverity = "error"
	ValidationSeverityWarn  ValidationSeverity = "warn"
	ValidationSeverityInfo  ValidationSeverity = "info"
)

var validSeverities = map[string]ValidationSeverity{
	"":                              ValidationSeverityError,
	string(ValidationSeverityError): ValidationSeverityError,
	string(ValidationSeverityWarn):  ValidationSeverityWarn,
	string(ValidationSeverityInfo):  ValidationSeverityInfo,
}

type Validation struct {
	ID               uint               `json:"id" swaggertype:"integer" example:"1"`
	TemplateColumnID ID                 `json:"template_column_id" swaggertype:"string" example:"a1ed136d-33ce-4b7e-a7a4-8a5ccfe54cd5"`
	Validate         string             `json:"validate" example:"not_blank"`
	Options          jsonb.JSONB        `json:"options" swaggertype:"string" example:"true"`
	Message          string             `json:"message" example:"This column must contain a value"`
	Severity         ValidationSeverity `json:"severity" swaggertype:"string" example:"error"`

	Evaluator evaluator.Evaluator `json:"-"`
}

func (v Validation) Evaluate(cell string) (bool, string) {
	if v.Evaluator == nil {
		tf.Log.Errorw("Attempted to call EvaluateWithResult with nil evaluator", "validation_id", v.ID, "cell", cell, "options", v.Options.ToString())
		return true, cell
	}
	passed, value, err := v.Evaluator.Evaluate(cell)
	if err != nil {
		tf.Log.Warnw("Cell validation error", "validation_id", v.ID, "cell", cell, "options", v.Options.ToString(), "error", err)
	}
	return passed, value
}

func ParseValidation(id uint, templateColumnID, validateStr string, options jsonb.JSONB, message, severity string, dataType TemplateColumnDataType) (*Validation, error) {
	v := &Validation{
		ID:               id,
		TemplateColumnID: ParseID(templateColumnID),
		Validate:         validateStr,
		Options:          options,
		Message:          strings.TrimSpace(message),
	}
	var err error

	if v.Severity, err = ParseValidationSeverity(severity); err != nil {
		return nil, err
	}
	if v.Evaluator, err = evaluator.Parse(validateStr, options); err != nil {
		return nil, err
	}
	if !lo.Contains(v.Evaluator.AllowedDataTypes(), string(dataType)) {
		return nil, fmt.Errorf("The validation %s is only compatible with the data type%s %s",
			validateStr,
			lo.Ternary(len(v.Evaluator.AllowedDataTypes()) == 1, "", "s"),
			strings.Join(v.Evaluator.AllowedDataTypes(), ", "))
	}
	if len(v.Message) == 0 {
		v.Message = v.Evaluator.DefaultMessage()
	}
	return v, nil
}

func ParseValidationSeverity(severity string) (ValidationSeverity, error) {
	s, ok := validSeverities[severity]
	if !ok {
		return "", fmt.Errorf("The validation severity %v is invalid", severity)
	}
	return s, nil
}
