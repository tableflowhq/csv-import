package tf

import (
	"github.com/gocql/gocql"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"google.golang.org/grpc"
)

var Log *zap.SugaredLogger
var DB *gorm.DB
var Scylla *gocql.Session
var TableFlowAI *grpc.ClientConn