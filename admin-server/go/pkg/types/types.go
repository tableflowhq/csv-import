package types

import (
	"fmt"
	"github.com/guregu/null"
	"github.com/lib/pq"
	"strings"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
	"unicode"
)

type Res struct {
	Err     string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

type UploadRow struct {
	Index  int            `json:"index" example:"0"`
	Values map[int]string `json:"values"`
}

type ImportRow struct {
	Index  int               `json:"index" example:"0"`
	Values map[string]string `json:"values"`
}

type ImportServiceImporter struct {
	ID                     model.ID               `json:"id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	Name                   string                 `json:"name" example:"Test Importer"`
	SkipHeaderRowSelection bool                   `json:"skip_header_row_selection" example:"false"`
	Template               *ImportServiceTemplate `json:"template"`
}

type ImportServiceTemplate struct {
	ID              model.ID                       `json:"id,omitempty" swaggertype:"string" example:"f0797968-becc-422a-b135-19de1d8c5d46"`
	Name            string                         `json:"name,omitempty" example:"My Template"`
	TemplateColumns []*ImportServiceTemplateColumn `json:"columns"`
}

type ImportServiceTemplateColumn struct {
	ID          model.ID `json:"id" swaggertype:"string" example:"a1ed136d-33ce-4b7e-a7a4-8a5ccfe54cd5"`
	Name        string   `json:"name" example:"First Name"`
	Key         string   `json:"key" example:"email"`
	Required    bool     `json:"required" example:"false"`
	Description string   `json:"description" example:"The first name"`
}

type ImportServiceUpload struct {
	ID             model.ID               `json:"id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	TusID          string                 `json:"tus_id" example:"ee715c254ee61855b465ed61be930487"`
	ImporterID     model.ID               `json:"importer_id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	FileName       null.String            `json:"file_name" swaggertype:"string" example:"example.csv"`
	FileType       null.String            `json:"file_type" swaggertype:"string" example:"text/csv"`
	FileExtension  null.String            `json:"file_extension" swaggertype:"string" example:"csv"`
	FileSize       null.Int               `json:"file_size" swaggertype:"integer" example:"1024"`
	Metadata       model.JSONB            `json:"metadata" swaggertype:"string" example:"{\"user_id\": 1234}"`
	Template       *ImportServiceTemplate `json:"template"` // Set if the user passes in a template to the SDK, which overrides the template on the importer
	IsStored       bool                   `json:"is_stored" example:"false"`
	HeaderRowIndex null.Int               `json:"header_row_index" swaggertype:"integer" example:"0"`
	CreatedAt      model.NullTime         `json:"created_at" swaggertype:"integer" example:"1682366228"`

	UploadRows    []UploadRow                  `json:"upload_rows"`
	UploadColumns []*ImportServiceUploadColumn `json:"upload_columns"`
}

type ImportServiceUploadColumn struct {
	ID         model.ID       `json:"id" swaggertype:"string" example:"3c79e7fd-1018-4a27-8b86-9cee84221cd8"`
	Name       string         `json:"name" example:"Work Email"`
	Index      int            `json:"index" example:"0"`
	SampleData pq.StringArray `json:"sample_data" gorm:"type:text[]" swaggertype:"array,string" example:"test@example.com"`
}

type ImporterServiceUploadHeaderRowSelection struct {
	Index *int `json:"index" example:"0"`
}

type ImportServiceImport struct {
	ID                 model.ID       `json:"id" swaggertype:"string" example:"da5554e3-6c87-41b2-9366-5449a2f15b53"`
	UploadID           model.ID       `json:"upload_id" swaggertype:"string" example:"50ca61e1-f683-4b03-9ec4-4b3adb592bf1"`
	ImporterID         model.ID       `json:"importer_id" swaggertype:"string" example:"6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353"`
	NumRows            null.Int       `json:"num_rows" swaggertype:"integer" example:"256"`
	NumColumns         null.Int       `json:"num_columns" swaggertype:"integer" example:"8"`
	NumProcessedValues null.Int       `json:"num_processed_values" swaggertype:"integer" example:"128"`
	Metadata           model.JSONB    `json:"metadata"`
	IsStored           bool           `json:"is_stored" example:"false"`
	CreatedAt          model.NullTime `json:"created_at" swaggertype:"integer" example:"1682366228"`
	Error              null.String    `json:"error,omitempty" swaggerignore:"true"`
	Rows               []ImportRow    `json:"rows"`
}

func ConvertUpload(upload *model.Upload, uploadRows []UploadRow) (*ImportServiceUpload, error) {
	if uploadRows == nil {
		uploadRows = make([]UploadRow, 0)
	}
	importerUploadColumns := make([]*ImportServiceUploadColumn, len(upload.UploadColumns))
	for n, uc := range upload.UploadColumns {
		importerUploadColumns[n] = &ImportServiceUploadColumn{
			ID:         uc.ID,
			Name:       uc.Name,
			Index:      uc.Index,
			SampleData: uc.SampleData,
		}
	}
	uploadTemplate, err := ConvertUploadTemplate(upload.Template, false)
	if err != nil {
		tf.Log.Warnw("Could not convert upload template to import service template", "error", err, "upload_id", upload.ID, "upload_template", upload.Template)
		return nil, err
	}
	importerUpload := &ImportServiceUpload{
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

func ConvertUploadTemplate(template map[string]interface{}, generateIDs bool) (*ImportServiceTemplate, error) {
	if template == nil {
		// No template provided, this means the template from the importer will be used
		return nil, nil
	}
	var columns []*ImportServiceTemplateColumn

	columnData, exists := template["columns"]
	if !exists {
		return nil, fmt.Errorf("Invalid template: columns key not found")
	}

	columnSlice, ok := columnData.([]interface{})
	if !ok {
		return nil, fmt.Errorf("Invalid template: columns should be an array of objects")
	}

	seenKeys := make(map[string]bool)

	for _, item := range columnSlice {
		columnMap, ok := item.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("Invalid template: Each item in columns should be an object")
		}

		id, _ := columnMap["id"].(string)
		name, _ := columnMap["name"].(string)
		key, _ := columnMap["key"].(string)
		required, _ := columnMap["required"].(bool)
		description, _ := columnMap["description"].(string)

		if name == "" {
			return nil, fmt.Errorf("Invalid template: The paramter 'name' is required for each column")
		}

		generatedKey := false
		if key == "" {
			key = SanitizeKey(name)
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

		if generateIDs {
			id = model.NewID().String()
		}

		columns = append(columns, &ImportServiceTemplateColumn{
			ID:          model.ParseID(id),
			Name:        name,
			Key:         key,
			Required:    required,
			Description: description,
		})
	}

	if len(columns) == 0 {
		return nil, fmt.Errorf("Invalid template: No template columns were provided")
	}

	templateID := model.ID{}
	if generateIDs {
		templateID = model.NewID()
	} else {
		id, ok := template["id"].(string)
		if ok && len(id) != 0 {
			templateID = model.ParseID(id)
		}
	}

	return &ImportServiceTemplate{
		ID:              templateID,
		TemplateColumns: columns,
	}, nil
}

func SanitizeKey(input string) string {
	// Replace spaces with underscores
	result := strings.ReplaceAll(strings.ToLower(input), " ", "_")
	// Remove non-alphanumeric characters
	result = strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_' {
			return r
		}
		return -1
	}, result)
	return result
}

func ValidateKey(input string) bool {
	for _, r := range input {
		if !(unicode.IsLower(r) || unicode.IsDigit(r) || r == '_') {
			return false
		}
	}
	return true
}
