package scylla

import (
	"github.com/gocql/gocql"
	"sync"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/types"
)

const maxPageSize = 10000

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

	res := make([]map[int]string, iter.NumRows(), iter.NumRows())
	for i := 0; ; i++ {
		row := types.UploadRow{}
		if !iter.Scan(&row.Index, &row.Values) {
			break
		}
		res[i] = row.Values
	}
	return res
}

func GetImportRow(importID string, index int) (types.ImportRow, error) {
	row := types.ImportRow{}
	err := tf.Scylla.Query("select row_index, values from import_rows where import_id = ? and row_index = ?", importID, index).Scan(&row.Index, &row.Values)
	return row, err
}

func PaginateImportRows(importID string, offset, limit int) []types.ImportRow {
	if limit > maxPageSize {
		tf.Log.Errorw("Attempted to paginate import greater than max page size", "import_id", importID, "page_size", limit)
		return []types.ImportRow{}
	}

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

	res := make([]types.ImportRow, iter.NumRows(), iter.NumRows())
	for i := 0; ; i++ {
		row := types.ImportRow{}
		if !iter.Scan(&row.Index, &row.Values) {
			break
		}
		res[i] = row
	}
	return res
}

func ProcessBatch(in chan *gocql.Batch, wg *sync.WaitGroup) {
	wg.Add(1)
	for batch := range in {
		retryingBatchExecutor(batch)
	}
	wg.Done()
}

func retryingBatchExecutor(batch *gocql.Batch) {
	var err error
	maxRetries := 2
	for i := 0; i < maxRetries; i++ {
		err = tf.Scylla.ExecuteBatch(batch)
		if err == nil {
			//tf.Log.Debugw("Batch executed successfully")
			return
		}
		if (i + 1) < maxRetries {
			tf.Log.Warnw("Could not execute batch, retrying", "error", err, "attempt", i+1, "max_attempts", maxRetries)
		}
	}
	tf.Log.Errorw("Could not execute batch after final attempt", "error", err)
}
