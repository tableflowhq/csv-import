package tf

import (
	"github.com/gocql/gocql"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"gorm.io/gorm"
)

var Log *zap.SugaredLogger
var DB *gorm.DB
var Scylla *gocql.Session
var TableFlowAI *grpc.ClientConn
