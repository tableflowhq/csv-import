package file

import (
	"os"
	"path/filepath"
	"tableflow/go/pkg/tf"
)

var TempUploadsDirectory = ""
var TempDownloadsDirectory = ""
var TempImportsDirectory = ""

const tempDir = "/tmp/tableflow-files"
const dirMode = 0774

func CreateTempDirectories() error {
	err := os.MkdirAll(tempDir, dirMode)
	if err != nil {
		return err
	}
	TempUploadsDirectory = filepath.Join(tempDir, "uploads")
	if err = createTempDirectory(TempUploadsDirectory); err != nil {
		return err
	}
	TempDownloadsDirectory = filepath.Join(tempDir, "downloads")
	if err = createTempDirectory(TempDownloadsDirectory); err != nil {
		return err
	}
	TempImportsDirectory = filepath.Join(tempDir, "imports")
	if err = createTempDirectory(TempImportsDirectory); err != nil {
		return err
	}
	return nil
}

func RemoveTempDirectories() {
	if err := os.RemoveAll(tempDir); err != nil {
		tf.Log.Errorw("Error removing temp file directory", "error", err, "name", tempDir)
	}
	tf.Log.Debugw("Temp file directory removed", "name", tempDir)
}

func createTempDirectory(name string) error {
	err := os.Mkdir(name, dirMode)
	if err == nil {
		return nil
	}
	tf.Log.Warnw("Could not create temp directory, attempting to remove and try again", "name", name, "error", err)
	// If the creation results in an error the first time, attempt to remove the temp directory as it still may
	// exist from a previous improper shutdown
	err = os.RemoveAll(name)
	if err != nil {
		tf.Log.Errorw("Could not remove temp directory after failing to create it", "name", name, "error", err)
		_ = os.RemoveAll(tempDir)
		return err
	}
	err = os.Mkdir(name, dirMode)
	if err != nil {
		tf.Log.Warnw("Could not create temp directory after final attempt", "name", name, "error", err)
		_ = os.RemoveAll(tempDir)
	}
	return err
}
