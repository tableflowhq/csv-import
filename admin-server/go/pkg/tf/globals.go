package tf

import (
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var Log *zap.SugaredLogger
var DB *gorm.DB
var S3 *S3Handler

// APIServerURL the public facing URL where the API server can be accessed from external requests.
var APIServerURL = ""

// WebAppURL the public facing URL where the frontend can be accessed from external requests.
var WebAppURL = ""

// TODO: Create internal pkg for cloud and move these unused variables to "tfx" package
