package util

import (
	"errors"
	"go.uber.org/zap"
)

var Log *zap.SugaredLogger
var loggerInitialized bool

func InitLogger() error {
	if loggerInitialized {
		return errors.New("logger already initialized")
	}
	loggerInitialized = true
	zapLogger, _ := zap.NewDevelopment()
	defer zapLogger.Sync()
	Log = zapLogger.Sugar()
	return nil
}
