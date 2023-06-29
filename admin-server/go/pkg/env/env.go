package env

import (
	"errors"
	"github.com/joho/godotenv"
	"os"
	"strconv"
	"tableflow/go/pkg/util"
)

var (
	// APIServerURL the public facing URL where the API server can be accessed from external requests.
	APIServerURL = ""
	// APIServerPort the port which is used by the web server
	APIServerPort = 0
	// WebAppURL the public facing URL where the frontend can be accessed from external requests.
	WebAppURL = ""
)

var envInitialized bool

func InitEnv() error {
	var err error
	if envInitialized {
		return errors.New("env already initialized")
	}
	envInitialized = true

	// Used for docker deploy, the env is copied from the base directory to the backend directory
	_ = godotenv.Load(".env")
	// Used for development, the env exists only in the base directory
	_ = godotenv.Load("../.env")

	WebAppURL, err = util.ParseBaseURL(os.Getenv("TABLEFLOW_WEB_APP_URL"))
	if err != nil {
		util.Log.Errorw("Invalid TABLEFLOW_WEB_APP_URL provided: this must be set on the environment to the URL of where clients will access the front end web app", "error", err.Error())
		return err
	}
	APIServerURL, err = util.ParseBaseURL(os.Getenv("TABLEFLOW_API_SERVER_URL"))
	if err != nil {
		util.Log.Errorw("Invalid TABLEFLOW_API_SERVER_URL provided: this must be set on the environment to the URL of where the backend API server is accessible", "error", err.Error())
		return err
	}
	APIServerPort, err = strconv.Atoi(os.Getenv("TABLEFLOW_API_SERVER_PORT"))
	if err == nil && (APIServerPort < 0 || APIServerPort > 65536) {
		err = errors.New("port out of range")
	}
	if err != nil {
		util.Log.Errorw("Invalid TABLEFLOW_API_SERVER_PORT provided: this must be set on the environment to an available port where the API server can listen for requests", "error", err.Error())
		return err
	}
	return nil
}
