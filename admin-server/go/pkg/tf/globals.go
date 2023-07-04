package tf

import (
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var Log *zap.SugaredLogger
var DB *gorm.DB
var S3 *S3Handler
