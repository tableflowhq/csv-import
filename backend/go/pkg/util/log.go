package util

import (
	"go.uber.org/zap"
)

var Log *zap.SugaredLogger
var initialized bool

func InitLogger() {
	if initialized {
		return
	}
	initialized = true
	zapLogger, _ := zap.NewDevelopment()
	defer func(zapLogger *zap.Logger) {
		_ = zapLogger.Sync()
	}(zapLogger)
	Log = zapLogger.Sugar()
}
