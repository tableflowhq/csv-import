package service

import (
	"context"
	"errors"
	"fmt"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/gin-gonic/gin"
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
var s3Initialized bool
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

	/* S3 */
	err = initS3()
	if err != nil {
		tf.Log.Fatalw("Error initializing S3", "error", err.Error())
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

func initS3() error {
	if s3Initialized {
		return errors.New("s3 already initialized")
	}
	s3Initialized = true
	s3Config := &aws.Config{
		Region: aws.String(os.Getenv("AWS_REGION")),
		Credentials: credentials.NewStaticCredentials(
			os.Getenv("AWS_IAM_FILE_ACCESS_KEY"),
			os.Getenv("AWS_IAM_FILE_SECRET_KEY"), ""),
	}
	sess, err := session.NewSession(s3Config)
	if err != nil {
		return err
	}
	tf.S3 = &tf.S3Handler{
		Session:       sess,
		BucketUploads: os.Getenv("AWS_S3_FILE_UPLOADS_BUCKET_NAME"),
		BucketImports: os.Getenv("AWS_S3_FILE_IMPORTS_BUCKET_NAME"),
	}
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

	go func() {
		defer wg.Done()
		for {
			select {
			case <-ctx.Done():
				file.RemoveTempDirectories()
				return
			}
		}
	}()
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

	go func() {
		defer wg.Done()
		for {
			select {
			case <-ctx.Done():
				if err := server.Shutdown(ctx); err != nil {
					tf.Log.Fatalw("API server forced to shutdown", "error", err)
				}
				tf.Log.Debugw("API server shutdown")
				return
			}
		}
	}()
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

-- 		create index if not exists thirdparty_users_user_id_idx on thirdparty_users(user_id);
-- 		create or replace view users as (
-- 		    with
-- 			    all_users as (
-- 			        select users.user_id        as id
-- 			             , users.email
-- 			             , users.time_joined
-- 			             , users.third_party_id as recipe
-- 			             , true                 as email_verified
-- 			        from thirdparty_users users
-- 			        union all
-- 			        select users.user_id           as id
-- 			             , users.email
-- 			             , users.time_joined
-- 			             , 'email'                 as recipe
-- 			             , eve.user_id is not null as email_verified
-- 			        from emailpassword_users users
-- 			             left join emailverification_verified_emails eve on eve.user_id = users.user_id
-- 			    )
-- 		    select all_users.id
-- 		         , all_users.email
-- 		         , all_users.time_joined
-- 		         , roles.role
-- 		         , all_users.recipe
-- 		         , all_users.email_verified
-- 		    from all_users
-- 		         left join user_roles roles on all_users.id = roles.user_id
-- 		);
	`
}
