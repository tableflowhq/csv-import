package util

import (
	"encoding/csv"
	"errors"
	"github.com/xuri/excelize/v2"
	"io"
	"os"
	"tableflow/go/pkg/tf"
)

type DataFileIterator struct {
	File   *os.File
	GetRow func() ([]string, error)
	Close  func()
}

func GetFileSize(file *os.File) (int64, error) {
	fileStat, err := file.Stat()
	if err == nil {
		return fileStat.Size(), nil
	}
	tf.Log.Errorw("Unable to determine file size", "error", err)
	return 0, err
}

func ResetFileReader(file *os.File) {
	_, err := file.Seek(0, io.SeekStart)
	if err != nil {
		tf.Log.Errorw("Error resetting file reader", "error", err)
	}
}

func OpenDataFileIterator(file *os.File, fileType string) (DataFileIterator, error) {
	it := DataFileIterator{}
	it.File = file
	switch fileType {
	case "text/csv":
		r := csv.NewReader(file)
		it.GetRow = func() ([]string, error) {
			return r.Read()
		}
		it.Close = func() {
			ResetFileReader(it.File)
		}
		return it, nil
	case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
		f, err := excelize.OpenReader(file)
		if err != nil {
			return it, err
		}
		sheets := f.GetSheetList()
		if len(sheets) == 0 {
			return it, errors.New("no sheets found in file")
		}
		rows, err := f.Rows(sheets[0])
		if err != nil {
			return it, err
		}
		it.GetRow = func() ([]string, error) {
			if !rows.Next() {
				return []string{}, io.EOF
			}
			return rows.Columns()
		}
		it.Close = func() {
			closeErr := rows.Close()
			if closeErr != nil {
				tf.Log.Errorw("Error closing excel file during iteration", "error", err)
			}
			ResetFileReader(it.File)
		}
		return it, nil
	default:
		return it, errors.New("unsupported file type")
	}
}
