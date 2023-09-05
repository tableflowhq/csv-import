package scylla

import (
	"github.com/gocql/gocql"
	"sort"
	"strings"
	"sync"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/types"
	"tableflow/go/pkg/util"
)

const maxPageSize = 10000
const MaxAllRowRetrieval = 25000
const BatchInsertSize = 1000
const DefaultPaginationSize = 1000

func PaginateUploadRows(uploadID string, offset, limit int) []map[int]string {
	if limit > maxPageSize {
		tf.Log.Errorw("Attempted to paginate upload greater than max page size", "upload_id", uploadID, "page_size", limit)
		return []map[int]string{}
	}

	iter := tf.Scylla.Query(
		`select row_index
					     , values
					from upload_rows
					where upload_id = ?
					  and row_index >= ?
					  and row_index < ?
					order by row_index
					limit ?`,
		uploadID, offset, offset+limit, limit).Iter()

	res := make([]map[int]string, 0, limit)
	for i := 0; ; i++ {
		row := types.UploadRow{}
		if !iter.Scan(&row.Index, &row.Values) {
			break
		}
		res = append(res, row.Values)
	}
	if err := iter.Close(); err != nil {
		tf.Log.Errorw("An error occurred closing the iterator while paginating upload rows", "upload_id", uploadID, "error", err)
	}
	return res
}

func GetImportRow(imp *model.Import, index int) (types.ImportRow, error) {
	importID := imp.ID.String()

	row := types.ImportRow{}
	err := tf.Scylla.Query("select row_index, values from import_rows where import_id = ? and row_index = ?", importID, index).Scan(&row.Index, &row.Values)

	// If the row does not exist it could be an error row, attempt to retrieve it from import_row_errors
	if len(row.Values) == 0 {
		err = tf.Scylla.Query("select row_index, values from import_row_errors where import_id = ? and row_index = ?", importID, index).Scan(&row.Index, &row.Values)
	}
	return row, err
}

func RetrieveAllImportRows(imp *model.Import) []types.ImportRow {
	if imp.NumRows.Int64 > MaxAllRowRetrieval {
		tf.Log.Errorw("Attempted to retrieve all import rows exceeding max allowed retrieval", "import_id", imp.ID, "num_rows", imp.NumRows.Int64, "max_rows_allowed", MaxAllRowRetrieval)
		return make([]types.ImportRow, 0)
	}

	var validations map[uint]model.Validation
	var err error

	if imp.HasErrors() {
		validations, err = db.GetValidationsMapForImporterUnscoped(imp.ImporterID.String())
		if err != nil {
			tf.Log.Errorw("Could not retrieve template by importer to get validations", "import_id", imp.ID, "error", err)
		}
	}

	rows := make([]types.ImportRow, 0, imp.NumRows.Int64)
	for offset := 0; ; offset += DefaultPaginationSize {
		if offset > int(imp.NumRows.Int64) {
			break
		}
		rows = append(rows, paginateImportRowsWithValidations(imp, validations, offset, DefaultPaginationSize)...)
	}
	return rows
}

func PaginateImportRows(imp *model.Import, offset, limit int) []types.ImportRow {
	var validations map[uint]model.Validation
	var err error

	if imp.HasErrors() {
		validations, err = db.GetValidationsMapForImporterUnscoped(imp.ImporterID.String())
		if err != nil {
			tf.Log.Errorw("Could not retrieve template by importer to get validations", "import_id", imp.ID, "error", err)
		}
	}

	return paginateImportRowsWithValidations(imp, validations, offset, limit)
}

func paginateImportRowsWithValidations(imp *model.Import, validations map[uint]model.Validation, offset, limit int) []types.ImportRow {
	importID := imp.ID.String()
	if limit > maxPageSize {
		tf.Log.Errorw("Attempted to paginate import greater than max page size", "import_id", importID, "page_size", limit)
		return []types.ImportRow{}
	}

	if !imp.HasErrors() {
		return getImportRows(importID, offset, limit)
	}

	importRows := getImportRows(importID, offset, limit)

	// If all the import rows exist in the expected page size, don't bother querying import_row_errors as no errors
	// exist for the page, or they have been resolved
	expectedPageSize := util.MinInt(int(imp.NumRows.Int64)-offset, limit)
	if len(importRows) == expectedPageSize {
		return importRows
	}

	// Retrieve the rows with errors to combine the results
	importRowErrors := getImportRowErrors(importID, offset, limit, validations)
	rows := append(importRows, importRowErrors...)

	// Sort the combined rows by the row index
	sort.Slice(rows, func(i, j int) bool {
		return rows[i].Index < rows[j].Index
	})
	return rows
}

func getImportRows(importID string, offset, limit int) []types.ImportRow {
	iter := tf.Scylla.Query(
		`select row_index
					     , values
					from import_rows
					where import_id = ?
					  and row_index >= ?
					  and row_index < ?
					order by row_index
					limit ?`,
		importID, offset, offset+limit, limit).Iter()

	res := make([]types.ImportRow, 0, limit)
	for i := 0; ; i++ {
		row := types.ImportRow{}
		if !iter.Scan(&row.Index, &row.Values) {
			break
		}
		res = append(res, row)
	}
	if err := iter.Close(); err != nil {
		tf.Log.Errorw("An error occurred closing the iterator while paginating import rows", "import_id", importID, "error", err)
	}
	return res
}

func getImportRowErrors(importID string, offset, limit int, validations map[uint]model.Validation) []types.ImportRow {
	iter := tf.Scylla.Query(
		`select row_index
					     , values
					     , errors
					from import_row_errors
					where import_id = ?
					  and row_index >= ?
					  and row_index < ?
					order by row_index
					limit ?`,
		importID, offset, offset+limit, limit).Iter()

	res := make([]types.ImportRow, 0, limit)
	for i := 0; ; i++ {
		row := types.ImportRow{}
		errors := make(map[string][]uint)
		if !iter.Scan(&row.Index, &row.Values, &errors) {
			break
		}
		// Transform the Scylla errors map values (validation IDs) into ImportRowErrors
		row.Errors = make(map[string][]types.ImportRowError)
		for rowKey, validationIDs := range errors {
			importRowErrors := make([]types.ImportRowError, len(validationIDs))
			for j, id := range validationIDs {
				if v, ok := validations[id]; ok {
					importRowErrors[j] = types.ImportRowError{
						ValidationID: id,
						Type:         v.Type.Name,
						Severity:     string(v.Severity),
						Message:      v.Message,
					}
				} else {
					tf.Log.Warnw("Attempted to set import row error with validation ID that was not provided", "import_id", importID, "validation_id", id, "row_index", row.Index, "row_key", rowKey)
				}
			}
			row.Errors[rowKey] = importRowErrors
		}
		res = append(res, row)
	}
	if err := iter.Close(); err != nil {
		tf.Log.Errorw("An error occurred closing the iterator while paginating import rows", "import_id", importID, "error", err)
	}
	return res
}

func NewBatchInserter() *gocql.Batch {
	b := tf.Scylla.NewBatch(gocql.LoggedBatch)
	//b.SetConsistency(gocql.One)
	//b.RetryPolicy(&gocql.SimpleRetryPolicy{NumRetries: 1})
	return b
}

func ProcessBatch(in chan *gocql.Batch, wg *sync.WaitGroup) {
	wg.Add(1)
	for batch := range in {
		err := tf.Scylla.ExecuteBatch(batch)
		if err != nil {
			tf.Log.Errorw("Failed to execute batch", "error", err)
		}
	}
	wg.Done()
}

func retryingBatchExecutor(batch *gocql.Batch) {
	var err error
	maxRetries := 2
	for i := 0; i < maxRetries; i++ {
		err = tf.Scylla.ExecuteBatch(batch)
		if err == nil {
			tf.Log.Debugw("Batch executed successfully")
			return
		}
		isIOError := strings.HasSuffix(err.Error(), "i/o timeout")
		if isIOError && (i+1) < maxRetries {
			tf.Log.Infow("Could not execute batch due to i/o error, retrying", "error", err, "attempt", i+1, "max_attempts", maxRetries)
		}
	}
	tf.Log.Errorw("Could not execute batch after final attempt", "error", err)
}

func GetScyllaKeyspaceConfigurationCQL() string {
	return `
		create keyspace if not exists tableflow
		    with replication = { 'class' : 'NetworkTopologyStrategy', 'replication_factor' : 3}
		     and durable_writes = true;
	`
}

func GetScyllaSchemaConfigurationCQL() []string {
	return []string{
		`create table if not exists upload_rows (
		    upload_id  uuid,
		    row_index int,
		    values     map<int, text>,
		    primary key ((upload_id),row_index)
		);`,
		`create table if not exists import_rows (
		    import_id  uuid,
		    row_index int,
		    values     map<text, text>,
		    primary key ((import_id),row_index)
		);`,
		`create table if not exists import_row_errors (
		    import_id uuid,
		    row_index int,
		    -- values: Holds the actual import_row data. As an error is resolved this is updated. Once all errors are resolved, we insert into import_rows.
		    values    map<text, text>,             -- <Row key, Cell Value>
		    -- errors: Holds a set of Validation IDs that failed for a given cell. As errors are resolved the IDs are removed from the set. If all errors are resolved for a cell, the key is removed from the map.
		    errors    map<text, frozen<set<int>>>, -- <Row key, Set of Validation IDs (stored in Postgres to reference complete validation information and keep this table smaller)>
		    primary key ((import_id),row_index)
		);`,
	}
}
