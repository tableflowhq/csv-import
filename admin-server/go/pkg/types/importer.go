package types

import (
	"fmt"
	"github.com/guregu/null"
	"github.com/lib/pq"
	"strings"
	"tableflow/go/pkg/evaluator"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/model/jsonb"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/util"
)

// Contains the types and type-related methods used for the importer (file import service)
//
// These differ from the model package types because they are used to send and receive data from the file import
// service as there are fields we want to add and fields we don't want to expose to the importer.

/* ---------------------------  Importer types  --------------------------- */

type Importer struct {
	ID                     model.ID  `json:"id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	Name                   string    `json:"name" example:"Test Importer"`
	SkipHeaderRowSelection bool      `json:"skip_header_row_selection" example:"false"`
	Template               *Template `json:"template"`
}

type Template struct {
	ID              model.ID          `json:"id,omitempty" swaggertype:"string" example:"f0797968-becc-422a-b135-19de1d8c5d46"`
	Name            string            `json:"name,omitempty" example:"My Template"`
	TemplateColumns []*TemplateColumn `json:"columns"`
}

type TemplateColumn struct {
	ID                model.ID      `json:"id" swaggertype:"string" example:"a1ed136d-33ce-4b7e-a7a4-8a5ccfe54cd5"`
	Name              string        `json:"name" example:"First Name"`
	Key               string        `json:"key" example:"email"`
	Required          bool          `json:"required" example:"false"`
	DataType          string        `json:"data_type" example:"string"`
	Description       string        `json:"description" example:"The first name"`
	Validations       []*Validation `json:"validations,omitempty"`
	SuggestedMappings []string      `json:"suggested_mappings" swaggertype:"array,string" example:"first_name"`
}

type Validation struct {
	ValidationID uint        `json:"id,omitempty" swaggertype:"integer" example:"4581"`
	Validate     string      `json:"validate" example:"not_blank"`
	Options      jsonb.JSONB `json:"options" swaggertype:"string" example:"true"`
	Message      string      `json:"message" example:"The cell must contain a value"`
	Severity     string      `json:"severity" example:"error"`
}

/* ---------------------------  Upload types  --------------------------- */

type Upload struct {
	ID             model.ID       `json:"id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	TusID          string         `json:"tus_id" example:"ee715c254ee61855b465ed61be930487"`
	ImporterID     model.ID       `json:"importer_id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	FileName       null.String    `json:"file_name" swaggertype:"string" example:"example.csv"`
	FileType       null.String    `json:"file_type" swaggertype:"string" example:"text/csv"`
	FileExtension  null.String    `json:"file_extension" swaggertype:"string" example:"csv"`
	FileSize       null.Int       `json:"file_size" swaggertype:"integer" example:"1024"`
	Metadata       jsonb.JSONB    `json:"metadata" swaggertype:"string" example:"{\"user_id\": 1234}"`
	Template       *Template      `json:"template"` // Set if the user passes in a template to the SDK, which overrides the template on the importer
	IsStored       bool           `json:"is_stored" example:"false"`
	HeaderRowIndex null.Int       `json:"header_row_index" swaggertype:"integer" example:"0"`
	CreatedAt      model.NullTime `json:"created_at" swaggertype:"integer" example:"1682366228"`

	UploadRows    []UploadRow     `json:"upload_rows"`
	UploadColumns []*UploadColumn `json:"upload_columns"`
}

type UploadColumn struct {
	ID                        model.ID       `json:"id" swaggertype:"string" example:"3c79e7fd-1018-4a27-8b86-9cee84221cd8"`
	Name                      string         `json:"name" example:"Work Email"`
	Index                     int            `json:"index" example:"0"`
	SampleData                pq.StringArray `json:"sample_data" gorm:"type:text[]" swaggertype:"array,string" example:"test@example.com"`
	SuggestedTemplateColumnID model.ID       `json:"suggested_template_column_id" swaggertype:"string" example:"a1ed136d-33ce-4b7e-a7a4-8a5ccfe54cd5"`
}

type UploadHeaderRowSelection struct {
	Index *int `json:"index" example:"0"`
}

type UploadRow struct {
	Index  int            `json:"index" example:"0"`
	Values map[int]string `json:"values"`
}

/* ---------------------------  Import types  --------------------------- */

type Import struct {
	ID                 model.ID            `json:"id" swaggertype:"string" example:"da5554e3-6c87-41b2-9366-5449a2f15b53"`
	UploadID           model.ID            `json:"upload_id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	ImporterID         model.ID            `json:"importer_id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	NumRows            null.Int            `json:"num_rows" swaggertype:"integer" example:"256"`
	NumColumns         null.Int            `json:"num_columns" swaggertype:"integer" example:"8"`
	NumProcessedValues null.Int            `json:"num_processed_values" swaggertype:"integer" example:"128"`
	Metadata           jsonb.JSONB         `json:"metadata"`
	IsStored           bool                `json:"is_stored" example:"false"`
	HasErrors          bool                `json:"has_errors" example:"false"`
	NumErrorRows       null.Int            `json:"num_error_rows" swaggertype:"integer" example:"32"`
	NumValidRows       null.Int            `json:"num_valid_rows" swaggertype:"integer" example:"224"`
	CreatedAt          model.NullTime      `json:"created_at" swaggertype:"integer" example:"1682366228"`
	Error              null.String         `json:"error,omitempty" swaggerignore:"true"`
	Rows               []ImportRowResponse `json:"rows,omitempty"` // Used for the final step in the onComplete
}

type ImportData struct {
	Pagination *Pagination `json:"pagination,omitempty"`
	Filter     *Filter     `json:"filter,omitempty"`
	Rows       []ImportRow `json:"rows"`
}

type ImportRow struct {
	Index  int                         `json:"index" example:"0"`
	Values map[string]string           `json:"values"`
	Errors map[string][]ImportRowError `json:"errors,omitempty"`
}

// ImportRowResponse used to return values externally in the data type expected
type ImportRowResponse struct {
	Index  int                         `json:"index" example:"0"`
	Values map[string]interface{}      `json:"values"`
	Errors map[string][]ImportRowError `json:"errors,omitempty"`
}

type ImportRowError struct {
	ValidationID uint   `json:"-"`
	Validate     string `json:"validate"`
	Severity     string `json:"severity"`
	Message      string `json:"message"`
}

type ImportCell struct {
	RowIndex  *int    `json:"row_index" example:"0"`
	CellKey   *string `json:"cell_key" example:"first_name"`
	CellValue *string `json:"cell_value" example:"Laura"`
}

type ImportCellEditResponse struct {
	NumRows      null.Int  `json:"num_rows" swaggertype:"integer" example:"256"`
	NumValidRows null.Int  `json:"num_valid_rows" swaggertype:"integer" example:"224"`
	NumErrorRows null.Int  `json:"num_error_rows" swaggertype:"integer" example:"32"`
	HasErrors    bool      `json:"has_errors" example:"false"`
	Row          ImportRow `json:"row,omitempty"`
}

func ConvertUpload(upload *model.Upload, uploadRows []UploadRow) (*Upload, error) {
	if uploadRows == nil {
		uploadRows = make([]UploadRow, 0)
	}
	importerUploadColumns := make([]*UploadColumn, len(upload.UploadColumns))
	for n, uc := range upload.UploadColumns {
		importerUploadColumns[n] = &UploadColumn{
			ID:                        uc.ID,
			Name:                      uc.Name,
			Index:                     uc.Index,
			SampleData:                uc.SampleData,
			SuggestedTemplateColumnID: uc.TemplateColumnID,
		}
	}
	uploadTemplate, err := ConvertRawTemplate(upload.Template, false, nil, false)
	if err != nil {
		tf.Log.Warnw("Could not convert upload template to import service template", "error", err, "upload_id", upload.ID, "upload_template", upload.Template)
		return nil, err
	}
	importerUpload := &Upload{
		ID:             upload.ID,
		TusID:          upload.TusID,
		ImporterID:     upload.ImporterID,
		FileName:       upload.FileName,
		FileType:       upload.FileType,
		FileExtension:  upload.FileExtension,
		FileSize:       upload.FileSize,
		Metadata:       upload.Metadata,
		Template:       uploadTemplate,
		IsStored:       upload.IsStored,
		HeaderRowIndex: upload.HeaderRowIndex,
		CreatedAt:      upload.CreatedAt,
		UploadColumns:  importerUploadColumns,
		UploadRows:     uploadRows,
	}
	return importerUpload, nil
}

func ConvertRawTemplate(rawTemplate jsonb.JSONB, isCreation bool, allowedValidateTypes map[string]bool, failOnNotAllowedType bool) (*Template, error) {
	if !rawTemplate.Valid {
		// No template provided, this means the template from the importer will be used
		return nil, nil
	}
	template, ok := rawTemplate.AsMap()
	if !ok {
		return nil, fmt.Errorf("Invalid template: malformed object")
	}

	var columns []*TemplateColumn

	columnData, exists := template["columns"]
	if !exists {
		return nil, fmt.Errorf("Invalid template: columns key not found")
	}

	columnSlice, ok := columnData.([]interface{})
	if !ok {
		return nil, fmt.Errorf("Invalid template: columns should be an array of objects")
	}

	seenKeys := make(map[string]bool)
	seenSuggestedMappings := make(map[string]bool)
	var generatedValidationID uint = 1

	for _, item := range columnSlice {
		columnMap, ok := item.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("Invalid template: Each item in columns should be an object")
		}

		id, _ := columnMap["id"].(string)
		name, _ := columnMap["name"].(string)
		key, _ := columnMap["key"].(string)
		required, _ := columnMap["required"].(bool)
		dataTypeStr, _ := columnMap["data_type"].(string)
		description, _ := columnMap["description"].(string)
		suggestedMappings := make([]string, 0)
		validations := make([]*Validation, 0)

		if name == "" {
			return nil, fmt.Errorf("Invalid template: The paramter 'name' is required for each column")
		}

		dataType, err := model.ParseTemplateColumnDataType(dataTypeStr)
		if err != nil {
			return nil, fmt.Errorf("Invalid template: %s", err.Error())
		}

		generatedKey := false
		if key == "" {
			key = util.SanitizeKey(name)
			generatedKey = true
		} else if !model.IsValidTemplateColumnKey(key) {
			return nil, fmt.Errorf("Invalid template: The column key %v can only contain lowercase letters, numbers, and underscores", key)
		}

		if _, keyExists := seenKeys[key]; keyExists {
			if generatedKey {
				return nil, fmt.Errorf("Invalid template: Duplicate keys are not allowed: %s. This key was generated from the column name, since a key was not provided", key)
			} else {
				return nil, fmt.Errorf("Invalid template: Duplicate keys are not allowed: %s", key)
			}
		}
		seenKeys[key] = true

		// Suggested mappings
		if suggestedMappingsInterface, ok := columnMap["suggested_mappings"].([]interface{}); ok {
			for _, v := range suggestedMappingsInterface {
				if mappingVal, ok := v.(string); ok {
					mappingVal = strings.TrimSpace(mappingVal)
					// Make sure the new mappings are all unique (case-insensitive) and don't contain blank values
					if util.IsBlankUnicode(mappingVal) {
						return nil, fmt.Errorf("Invalid template: suggested_mappings cannot contain blank values")
					}
					str := strings.ToLower(mappingVal)
					if seenSuggestedMappings[str] {
						return nil, fmt.Errorf("Invalid template: suggested_mappings cannot contain duplicate values (%v)", mappingVal)
					}
					seenSuggestedMappings[str] = true
					suggestedMappings = append(suggestedMappings, mappingVal)
				}
			}
		}

		if isCreation {
			id = model.NewID().String()

			if evaluator.IsDataTypeEvaluator(string(dataType)) {
				// Add the default data type validation
				validation, err := model.ParseValidation(generatedValidationID, id, string(dataType), jsonb.NewNull(), "", "", dataType)
				generatedValidationID++
				if err != nil {
					return nil, err
				}
				validations = append(validations, &Validation{
					ValidationID: validation.ID,
					Validate:     validation.Validate,
					Options:      validation.Options,
					Message:      validation.Message,
					Severity:     string(validation.Severity),
				})
			}
		}

		// Validations
		if validationsInterface, ok := columnMap["validations"].([]interface{}); ok {
			for _, v := range validationsInterface {
				if validationMap, ok := v.(map[string]interface{}); ok {
					validationID, _ := validationMap["id"].(float64)
					validationValidate, _ := validationMap["validate"].(string)
					validationOptions, _ := validationMap["options"]
					validationMessage, _ := validationMap["message"].(string)
					validationSeverity, _ := validationMap["severity"].(string)

					if allowedValidateTypes != nil && !allowedValidateTypes[validationValidate] {
						if failOnNotAllowedType {
							return nil, fmt.Errorf("Invalid template: please upgrade your plan to use the %s validate type", validationValidate)
						}
						continue
					}
					if isCreation {
						validationID = float64(generatedValidationID)
						generatedValidationID++

						// Don't allow the user to add a data type validator (these are added automatically based on the data type)
						if evaluator.IsDataTypeEvaluator(validationValidate) {
							return nil, fmt.Errorf("Invalid template: the validate type %v cannot be added directly and is automatically added when setting a data type", validationValidate)
						}
					}
					validationValueJSON, err := jsonb.FromInterface(validationOptions)
					if err != nil {
						return nil, fmt.Errorf("Invalid template: invalid validation options json")
					}
					validation, err := model.ParseValidation(
						uint(validationID),
						id,
						validationValidate,
						validationValueJSON,
						validationMessage,
						validationSeverity,
						dataType,
					)
					if err != nil {
						return nil, err
					}
					validations = append(validations, &Validation{
						ValidationID: validation.ID,
						Validate:     validation.Validate,
						Options:      validation.Options,
						Message:      validation.Message,
						Severity:     string(validation.Severity),
					})
				}
			}
		}

		columns = append(columns, &TemplateColumn{
			ID:                model.ParseID(id),
			Name:              name,
			Key:               key,
			Required:          required,
			DataType:          string(dataType),
			Description:       description,
			SuggestedMappings: suggestedMappings,
			Validations:       validations,
		})
	}

	if len(columns) == 0 {
		return nil, fmt.Errorf("Invalid template: No template columns were provided")
	}

	templateID := model.ID{}
	if isCreation {
		templateID = model.NewID()
	} else {
		id, ok := template["id"].(string)
		if ok && len(id) != 0 {
			templateID = model.ParseID(id)
		}
	}

	return &Template{
		ID:              templateID,
		TemplateColumns: columns,
	}, nil
}

// ConvertImportRowsResponse converts []ImportRow to []ImportRowResponse to the response will have the values in the correct data type
func ConvertImportRowsResponse(rows []ImportRow, imp *model.Import) []ImportRowResponse {
	dataTypesRaw, ok := imp.DataTypes.AsMap()
	if !ok {
		tf.Log.Errorw("Failed to parse import data types", "import_id", imp.ID)
		return make([]ImportRowResponse, 0)
	}

	dataTypes := make(map[string]model.TemplateColumnDataType, len(dataTypesRaw))
	for k, v := range dataTypesRaw {
		dataTypeStr, ok := dataTypesRaw[k].(string)
		if !ok {
			tf.Log.Errorw("Import row data type value not string", "import_id", imp.ID, "key", k, "value", v, "data_type", dataTypeStr)
			continue
		}
		dataType, err := model.ParseTemplateColumnDataType(dataTypeStr)
		if err != nil {
			tf.Log.Errorw("Failed to parse import row data type", "import_id", imp.ID, "key", k, "value", v, "data_type", dataTypeStr)
			continue
		}
		dataTypes[k] = dataType
	}

	rowsResponse := make([]ImportRowResponse, len(rows), len(rows))
	for i, row := range rows {
		rowsResponse[i] = convertImportRow(row, dataTypes)
	}
	return rowsResponse
}

func convertImportRow(row ImportRow, dataTypes map[string]model.TemplateColumnDataType) ImportRowResponse {
	response := ImportRowResponse{
		Index:  row.Index,
		Values: make(map[string]interface{}, len(row.Values)),
		Errors: row.Errors,
	}
	for k, v := range row.Values {
		dataType := dataTypes[k]
		switch dataType {
		case model.TemplateColumnDataTypeString:
			response.Values[k] = v
		case model.TemplateColumnDataTypeNumber:
			val, _, err := util.StringToNumberOrNil(v)
			if err != nil {
				tf.Log.Warnw("Failed to convert import row value from data type", "index", row.Index, "value", v, "data_type", dataType)
			}
			response.Values[k] = val
		case model.TemplateColumnDataTypeBoolean:
			val, _, err := util.StringToBoolOrNil(v)
			if err != nil {
				tf.Log.Warnw("Failed to convert import row value from data type", "index", row.Index, "value", v, "data_type", dataType)
			}
			response.Values[k] = val
		case model.TemplateColumnDataTypeDate:
			// Dates are already converted at this point to the correct format
			response.Values[k] = v
		}
	}
	return response
}
