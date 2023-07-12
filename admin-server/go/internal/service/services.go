package service

import (
	"context"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gocql/gocql"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"os"
	"sync"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/file"
	"tableflow/go/pkg/model"
	"tableflow/go/pkg/tf"
	"tableflow/go/pkg/web"
	"time"
)

var loggerInitialized bool
var envInitialized bool
var dbInitialized bool
var scyllaInitialized bool
var tempStorageInitialized bool

func InitServices(ctx context.Context, wg *sync.WaitGroup) {
	var err error

	/* Logger */
	err = initLogger()
	if err != nil {
		tf.Log.Fatalw("Error initializing logger", "error", err.Error())
		return
	}

	/* Environment */
	err = initEnv()
	if err != nil {
		tf.Log.Errorw("Error loading initializing env", "error", err.Error())
		return
	}

	/* Postgres */
	err = initDatabase()
	if err != nil {
		tf.Log.Fatalw("Error initializing database", "error", err.Error())
		return
	}

	/* Scylla */
	wg.Add(1)
	err = initScylla(ctx, wg)
	if err != nil {
		tf.Log.Fatalw("Error initializing Scylla", "error", err.Error())
		return
	}

	/* Temp Storage */
	wg.Add(1)
	err = initTempStorage(ctx, wg)
	if err != nil {
		tf.Log.Fatalw("Error initializing temp storage", "error", err.Error())
		return
	}

	/* Web Server */
	wg.Add(1)
	err = initWebServer(ctx, wg)
	if err != nil {
		tf.Log.Fatalw("Error initializing web server", "error", err)
		return
	}
}

func shutdownHandler(ctx context.Context, wg *sync.WaitGroup, close func()) {
	defer wg.Done()
	for {
		select {
		case <-ctx.Done():
			close()
			return
		}
	}
}

func initLogger() error {
	if loggerInitialized {
		return errors.New("logger already initialized")
	}
	loggerInitialized = true
	zapLogger, _ := zap.NewDevelopment()
	defer zapLogger.Sync()
	tf.Log = zapLogger.Sugar()
	return nil
}

func initEnv() error {
	if envInitialized {
		return errors.New("env already initialized")
	}
	envInitialized = true

	// Used for docker deploy, the env is copied from the base directory to the backend directory
	_ = godotenv.Load(".env")
	// Used for development, the env exists only in the base directory
	_ = godotenv.Load("../.env")

	return nil
}

func initDatabase() error {
	if dbInitialized {
		return errors.New("db already initialized")
	}
	dbInitialized = true
	var err error
	// TODO: Add timezone support
	// TODO: Support sslmode
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=America/Los_Angeles",
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_PORT"),
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DATABASE_NAME"))
	tf.DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}
	if err = tf.DB.Exec(db.GetDatabaseSchemaInitSQL()).Error; err != nil {
		tf.Log.Errorw("Error running standard database initialization SQL", "error", err)
		return err
	}
	if err = tf.DB.Exec(getDatabaseConfigurationSQL()).Error; err != nil {
		tf.Log.Errorw("Error running env database initialization SQL", "error", err)
		return err
	}
	// If this is the first time starting up, create standard objects
	type Res struct {
		Exists bool
	}
	var res Res
	err = tf.DB.Raw("select exists(select 1 from users);").Scan(&res).Error
	if err != nil {
		tf.Log.Errorw("Error checking determining if first startup", "error", err)
		return err
	}
	if !res.Exists {
		// Create a new user
		user := &model.User{
			ID:         model.NewID(),
			TimeJoined: uint64(time.Now().Unix()),
			Role:       "owner",
			Recipe:     "none",
		}
		err = tf.DB.Create(&user).Error
		if err != nil {
			tf.Log.Errorw("Error creating new user", "error", err)
			return err
		}
		// Create the standard objects for that user
		_, err = db.CreateObjectsForNewUser(user)
		if err != nil {
			tf.Log.Errorw("Error creating objects for new user", "error", err)
			return err
		}
	}
	return nil
}

func initScylla(ctx context.Context, wg *sync.WaitGroup) error {
	if scyllaInitialized {
		return errors.New("scylla already initialized")
	}
	scyllaInitialized = true

	scyllaHost := os.Getenv("SCYLLA_HOST")
	// TODO: Remove
	tf.Log.Infof("Scylla host: %s", scyllaHost)
	systemCfg := gocql.NewCluster(scyllaHost)
	systemCfg.Keyspace = "system"
	systemSession, err := systemCfg.CreateSession()
	if err != nil {
		systemSession.Close()
		return err
	}
	if err = systemSession.Query(getScyllaKeyspaceConfigurationCQL()).Exec(); err != nil {
		systemSession.Close()
		return err
	}
	systemSession.Close()

	clusterCfg := gocql.NewCluster(scyllaHost)
	clusterCfg.Keyspace = "tableflow"
	//clusterCfg.Authenticator = gocql.PasswordAuthenticator{
	//	Username: "your_username",
	//	Password: "your_password",
	//}
	clusterCfg.NumConns = 8
	clusterCfg.PoolConfig = gocql.PoolConfig{
		HostSelectionPolicy: gocql.TokenAwareHostPolicy(gocql.RoundRobinHostPolicy()),
	}

	tf.Scylla, err = clusterCfg.CreateSession()
	if err != nil {
		tf.Scylla.Close()
		return err
	}
	for _, stmt := range getScyllaSchemaConfigurationCQL() {
		if err = tf.Scylla.Query(stmt).Exec(); err != nil {
			tf.Scylla.Close()
			return err
		}
	}

	go shutdownHandler(ctx, wg, func() { tf.Scylla.Close() })
	return nil
}

func initTempStorage(ctx context.Context, wg *sync.WaitGroup) error {
	if tempStorageInitialized {
		return errors.New("temp storage already initialized")
	}
	tempStorageInitialized = true

	err := file.CreateTempDirectories()
	if err != nil {
		return err
	}

	go shutdownHandler(ctx, wg, func() { file.RemoveTempDirectories() })
	return nil
}

func initWebServer(ctx context.Context, wg *sync.WaitGroup) error {
	webAppDefaultAuthToken := "tableflow"
	authHeaderToken := os.Getenv("TABLEFLOW_WEB_APP_AUTH_TOKEN")
	if len(authHeaderToken) == 0 {
		authHeaderToken = webAppDefaultAuthToken
	}
	adminAPIAuthValidator := web.APIKeyAuthMiddleware(func(c *gin.Context, apiKey string) bool {
		return apiKey == authHeaderToken
	})
	externalAPIAuthValidator := func(c *gin.Context, apiKey string) bool {
		workspaceID, err := db.GetWorkspaceIDFromAPIKey(apiKey)
		if err != nil || len(workspaceID) == 0 {
			return false
		}
		c.Set("workspace_id", workspaceID)
		return true
	}
	getWorkspaceUser := func(c *gin.Context, workspaceID string) (string, error) {
		if len(workspaceID) == 0 {
			return "", errors.New("no workspace ID provided in request")
		}
		type Res struct {
			UserID string
		}
		var res Res
		err := tf.DB.Raw("select user_id::text from workspace_users where workspace_id = ? limit 1;", model.ParseID(workspaceID)).Scan(&res).Error
		if err != nil {
			return "", err
		}
		if len(res.UserID) == 0 {
			return "", errors.New("error determining user in workspace")
		}
		return res.UserID, nil
	}
	getUserID := func(c *gin.Context) string {
		type Res struct {
			UserID string
		}
		var res Res
		err := tf.DB.Raw("select id::text as user_id from users limit 1;").Scan(&res).Error
		if err != nil || len(res.UserID) == 0 {
			return ""
		}
		return res.UserID
	}
	uploadLimitCheck := func(_ *model.Upload) error {
		return nil
	}
	config := web.ServerConfig{
		AdminAPIAuthValidator:    adminAPIAuthValidator,
		ExternalAPIAuthValidator: externalAPIAuthValidator,
		GetWorkspaceUser:         getWorkspaceUser,
		GetUserID:                getUserID,
		UploadLimitCheck:         uploadLimitCheck,
	}
	server := web.StartWebServer(config)

	go shutdownHandler(ctx, wg, func() {
		if err := server.Shutdown(ctx); err != nil {
			tf.Log.Fatalw("API server forced to shutdown", "error", err)
		}
		tf.Log.Debugw("API server shutdown")
	})
	return nil
}

func getDatabaseConfigurationSQL() string {
	return `
		create table if not exists users (
		    id          uuid primary key not null default gen_random_uuid(),
		    email       text,
		    time_joined bigint           not null,
		    role        text             not null,
		    recipe      text             not null,
		    initialized bool unique      not null default true,
		    constraint initialized check (initialized)
		);
	`
}

func getScyllaKeyspaceConfigurationCQL() string {
	return `
		create keyspace if not exists tableflow
		    with replication = { 'class' : 'NetworkTopologyStrategy', 'replication_factor' : 1}
		     and durable_writes = true;
	`
}

func getScyllaSchemaConfigurationCQL() []string {
	return []string{
		`create table if not exists upload_rows (
		    upload_id  uuid,
		    row_index int,
		    values     map<int, text>,
		    primary key ((upload_id),row_index)
		);`,
		`create table if not exists import_rows (
		    import_id  uuid,
		    row_index int,
		    values     map<text, text>,
		    primary key ((import_id),row_index)
		);`,
	}
}
