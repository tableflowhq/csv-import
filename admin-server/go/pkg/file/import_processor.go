package file

import (
	"github.com/gocql/gocql"
	"github.com/guregu/null"
	"github.com/samber/lo"
	"sync"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/model/jsonb"
	"tableflow/go/pkg/scylla"
	"tableflow/go/pkg/tf"
	"time"
)

type ImportProcessResult struct {
	NumRows            int
	NumColumns         int
	NumProcessedValues int
	NumErrorRows       int
	NumValidRows       int
}

type templateColumnKeyValidation struct {
	Key         string
	Validations []model.Validation
}

func ImportData(upload *model.Upload, template *model.Template) {
	imp := &model.Import{
		ID:       model.NewID(),
		UploadID: upload.ID,
		Metadata: upload.Metadata,
	}
	dataTypes := make(map[string]interface{})
	for _, tc := range template.TemplateColumns {
		dataTypes[tc.Key] = string(tc.DataType)
	}
	imp.DataTypes = jsonb.FromMap(dataTypes)

	err := tf.DB.Create(imp).Error
	if err != nil {
		tf.Log.Errorw("Could not create import in database", "error", err, "upload_id", upload.ID)
		return
	}

	importStartTime := time.Now()

	importResult, err := processAndStoreImport(template, upload, imp)
	if err != nil {
		tf.Log.Errorw("Could not process and store import", "error", err, "import_id", imp.ID)
		return
	}
	tf.Log.Infow("Import processing and storage complete", "import_id", imp.ID, "num_rows", importResult.NumRows, "time_taken", time.Since(importStartTime))

	imp.IsStored = true
	imp.NumRows = null.IntFrom(int64(importResult.NumRows))
	imp.NumColumns = null.IntFrom(int64(importResult.NumColumns))
	imp.NumProcessedValues = null.IntFrom(int64(importResult.NumProcessedValues))
	imp.NumErrorRows = null.IntFrom(int64(importResult.NumErrorRows))
	imp.NumValidRows = null.IntFrom(int64(importResult.NumValidRows))

	err = tf.DB.Save(imp).Error
	if err != nil {
		tf.Log.Errorw("Could not update import in database", "error", err, "import_id", imp.ID)
		return
	}
}

func processAndStoreImport(template *model.Template, upload *model.Upload, imp *model.Import) (ImportProcessResult, error) {
	columnKeyMap := generateColumnKeyMap(template, upload)
	numColumns := len(columnKeyMap)
	importID := imp.ID.String()

	importRowIndex := 0
	numProcessedValues := 0
	numValidRows := 0
	numErrorRows := 0

	goroutines := 8
	batchCounter := 0
	batchSize := 0                      // cumulative batch size in bytes
	maxMutationSize := 16 * 1024 * 1024 // 16MB
	safetyMargin := 0.75

	in := make(chan *gocql.Batch, 0)
	var wg sync.WaitGroup
	for i := 0; i < goroutines; i++ {
		go scylla.ProcessBatch(in, &wg)
	}
	b := scylla.NewBatchInserter()

	paginationPageSize := 1000

	// Start paginating through the upload rows after the header row
	for offset := int(upload.HeaderRowIndex.Int64) + 1; ; offset += paginationPageSize {
		if offset > int(upload.NumRows.Int64) {
			in <- b
			break
		}
		uploadRows := scylla.PaginateUploadRows(upload.ID.String(), offset, paginationPageSize)

		// Iterate over the upload rows in pages returned from Scylla
		for pageRowIndex := 0; pageRowIndex < len(uploadRows); pageRowIndex++ {
			approxMutationSize := 0

			// uploadRow example:
			// {0: 'Mary', 1: 'Jenkins', 2: 'mary@example.com', 3: '02/22/2020', 4: ''}
			uploadRow := uploadRows[pageRowIndex]

			// importRowValues example:
			// {'first_name': 'Mary', 'last_name': 'Jenkins', 'email': 'mary@example.com'}
			importRowValues := make(map[string]string, numColumns)

			// importRowErrors example (the numbers are the validation ID(s) which did not pass):
			// {'first_name': {4281}, 'email': {4281, 4295}}
			importRowErrors := make(map[string][]uint)

			// Iterate over columnKeyMap, the columns that have mappings set (also included any validations)
			// Rows ending in blank values may not exist in the uploadRow (i.e. excel), but we still want to set empty
			// values for those cells as they are logically empty in the source file
			//
			// columnKeyMap example:
			// {0: 'first_name', 1: 'last_name', 2: 'email'}

			for uploadColumnIndex, key := range columnKeyMap {

				// uploadColumnIndex = 0
				// cellValue         = Mary
				// key = first_name + validations
				// importRowValue    = {'first_name': 'Mary'}

				cellValue := uploadRow[uploadColumnIndex]

				// Perform validations on the cell, if any
				for _, v := range key.Validations {
					passed, value := v.Evaluate(cellValue)
					if !passed {
						// Add the validation ID to the slice at the key, or create a new entry if the key doesn't exist
						if _, ok := importRowErrors[key.Key]; ok {
							importRowErrors[key.Key] = append(importRowErrors[key.Key], v.ID)
						} else {
							importRowErrors[key.Key] = []uint{v.ID}
						}
					} else {
						cellValue = value
					}
				}

				// Add the cell value and update progress
				importRowValues[key.Key] = cellValue
				approxMutationSize += len(cellValue)
				numProcessedValues++
			}

			batchCounter++
			batchSize += approxMutationSize

			if len(importRowErrors) == 0 {
				numValidRows++
				b.Query("insert into import_rows (import_id, row_index, values) values (?, ?, ?)", importID, importRowIndex, importRowValues)
			} else {
				numErrorRows++
				b.Query("insert into import_row_errors (import_id, row_index, values, errors) values (?, ?, ?, ?)", importID, importRowIndex, importRowValues, importRowErrors)
			}

			batchSizeApproachingLimit := batchSize > int(float64(maxMutationSize)*safetyMargin)
			if batchSizeApproachingLimit {
				tf.Log.Infow("Sending in batch early due to limit approaching", "import_id", imp.ID, "batch_size", batchSize, "batch_counter", batchCounter)
			}
			if batchCounter == scylla.BatchInsertSize || batchSizeApproachingLimit {
				// Send in the batch and start a new one
				in <- b
				b = scylla.NewBatchInserter()
				batchCounter = 0
				batchSize = 0
			}
			importRowIndex++
		}
	}

	close(in)
	wg.Wait()

	return ImportProcessResult{
		NumRows:            importRowIndex,
		NumColumns:         numColumns,
		NumProcessedValues: numProcessedValues,
		NumErrorRows:       numErrorRows,
		NumValidRows:       numValidRows,
	}, nil
}

// generateColumnKeyMap
// For the columns that a user set a mapping for, create a map of the upload column indexes to the template column key
// This is used to store the import data in Scylla by the template column key
func generateColumnKeyMap(template *model.Template, upload *model.Upload) map[int]templateColumnKeyValidation {

	// templateRowMap == template column ID -> template column key + validations
	templateRowMap := make(map[string]templateColumnKeyValidation)
	for _, tc := range template.TemplateColumns {
		templateRowMap[tc.ID.String()] = templateColumnKeyValidation{
			Key:         tc.Key,
			Validations: lo.Map(tc.Validations, func(v *model.Validation, _ int) model.Validation { return *v }),
		}
	}

	// columnKeyMap == upload column index -> template column key + validations
	columnKeyMap := make(map[int]templateColumnKeyValidation)
	for _, uc := range upload.UploadColumns {
		if !uc.TemplateColumnID.Valid {
			continue
		}
		if key, ok := templateRowMap[uc.TemplateColumnID.String()]; ok {
			columnKeyMap[uc.Index] = key
		}
	}
	return columnKeyMap
}
