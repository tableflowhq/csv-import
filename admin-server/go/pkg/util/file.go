package util

import "os"

func GetFileSize(file *os.File) (int64, error) {
	fileStat, err := file.Stat()
	if err == nil {
		return fileStat.Size(), nil
	}
	Log.Errorw("Unable to determine file size", "error", err)
	return 0, err
}
