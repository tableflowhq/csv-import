package model

import (
	"encoding/json"
	"fmt"
	"gorm.io/gorm"
	"tableflow/go/pkg/model/jsonb"
	"tableflow/go/pkg/tf"
)

type ValidationSeverity string

const (
	ValidationSeverityError ValidationSeverity = "error"
	ValidationSeverityWarn  ValidationSeverity = "warn"
	ValidationSeverityInfo  ValidationSeverity = "info"
)

type Validation struct {
	ID               uint               `json:"id" swaggertype:"integer" example:"1"`
	TemplateColumnID ID                 `json:"template_column_id" swaggertype:"string" example:"a1ed136d-33ce-4b7e-a7a4-8a5ccfe54cd5"`
	Type             ValidationType     `json:"type" swaggertype:"string" example:"filled"`
	Value            jsonb.JSONB        `json:"value" swaggertype:"string" example:"true"`
	Message          string             `json:"message" example:"This column must contain a value"`
	Severity         ValidationSeverity `json:"severity" swaggertype:"string" example:"error"`
	DeletedAt        gorm.DeletedAt     `json:"-"`
}

type ValidationResult struct {
	Message  string             `json:"message"`
	Severity ValidationSeverity `json:"severity"`
}

func (v Validation) Validate(cell string) bool {
	passed, err := v.Type.Evaluator.Evaluate(v.Value.Data, cell)
	if err != nil {
		tf.Log.Warnw("Cell validation error", "validation_id", v.ID, "cell", cell, "value", v.Value.ToString(), "error", err)
	}
	return passed
}

func (v Validation) ValidateWithResult(cell string) (bool, ValidationResult) {
	passed, err := v.Type.Evaluator.Evaluate(v.Value.Data, cell)
	if err != nil {
		tf.Log.Warnw("Cell validation error", "validation_id", v.ID, "cell", cell, "value", v.Value.ToString(), "error", err)
		return false, ValidationResult{
			Message:  fmt.Sprintf("Unexpected error: %v", err.Error()),
			Severity: ValidationSeverityError,
		}
	}
	if passed {
		return true, ValidationResult{}
	}
	return false, ValidationResult{
		Message:  v.Message,
		Severity: v.Severity,
	}
}

func (v Validation) MarshalJSON() ([]byte, error) {
	type Alias Validation // Create an alias to avoid recursive call
	tmp := struct {
		Type string `json:"type"`
		Alias
	}{
		Type:  v.Type.Name, // Extract from ValidationType
		Alias: Alias(v),
	}
	return json.Marshal(tmp)
}

func (v *Validation) UnmarshalJSON(data []byte) error {
	type Alias Validation // Create an alias to avoid recursive call
	tmp := struct {
		Type string `json:"type"`
		Alias
	}{
		Alias: Alias(*v),
	}
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	v.Type.Name = tmp.Type // Set into ValidationType
	*v = Validation(tmp.Alias)
	return nil
}
