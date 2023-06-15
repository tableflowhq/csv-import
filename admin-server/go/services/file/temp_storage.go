package file

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"tableflow/go/pkg/util"
	"tableflow/go/services"
)

const tempDir = "/tmp/rowdash-files"
const dirMode = 0774

var tempStorageInitialized bool
var (
	TempUploadsDirectory   = ""
	TempDownloadsDirectory = ""
	TempImportsDirectory   = ""
)

func InitTempStorage(ctx context.Context) error {
	if tempStorageInitialized {
		return errors.New("temp storage already initialized")
	}
	tempStorageInitialized = true

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

	go func() {
		defer services.ShutdownWaitGroup.Done()
		for {
			select {
			case <-ctx.Done():
				if err := os.RemoveAll(tempDir); err != nil {
					util.Log.Errorw("Error removing temp file directory", "error", err, "name", tempDir)
				}
				util.Log.Debugw("Temp file directory removed", "name", tempDir)
				return
			}
		}
	}()
	return nil
}

func createTempDirectory(name string) error {
	err := os.Mkdir(name, dirMode)
	if err == nil {
		return nil
	}
	util.Log.Warnw("Could not create temp directory, attempting to remove and try again", "name", name, "error", err)
	// If the creation results in an error the first time, attempt to remove the temp directory as it still may
	// exist from a previous improper shutdown
	err = os.RemoveAll(name)
	if err != nil {
		util.Log.Errorw("Could not remove temp directory after failing to create it", "name", name, "error", err)
		_ = os.RemoveAll(tempDir)
		return err
	}
	err = os.Mkdir(name, dirMode)
	if err != nil {
		util.Log.Warnw("Could not create temp directory after final attempt", "name", name, "error", err)
		_ = os.RemoveAll(tempDir)
	}
	return err
}
