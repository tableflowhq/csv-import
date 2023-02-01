package main

import (
	"context"
	"encoding/json"
	"github.com/jackc/pgx"
	"github.com/joho/godotenv"
	"github.com/pkg/errors"
	"os"
	"os/signal"
	"pg_auto_trigger/go/pkg/util"
	"strconv"
	"syscall"
	"time"
)

type NotifyPayload struct {
	Table string                 `json:"table"`
	Op    string                 `json:"op"`
	Data  map[string]interface{} `json:"data"`
}

var postRequestURL string
var postRequestBody string

func main() {
	ctx := context.Background()
	util.InitializeLogger()

	envErr := godotenv.Load()
	if envErr != nil {
		util.Log.Warnw("Could not load .env file", "error", envErr)
	}

	postRequestURL = os.Getenv("POST_REQUEST_URL")
	postRequestBody = os.Getenv("POST_REQUEST_BODY")

	isPostRequestBodyValidJSON := util.IsValidJSON(postRequestBody) || len(postRequestBody) == 0
	if !isPostRequestBodyValidJSON {
		util.Log.Fatalw("POST_REQUEST_BODY env variable must be valid JSON or empty")
		return
	}

	pool, poolErr := startPostgres(ctx)
	if poolErr != nil {
		util.Log.Fatalw("Error starting postgres", "error", poolErr)
	}
	defer pool.Close()
	util.Log.Infow("Server started, connected to database")

	// Wait for interrupt signal to gracefully shut down the server with a timeout
	quit := make(chan os.Signal)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	util.Log.Infow("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	util.Log.Infow("Server shutdown")
}

func envPGConfig() pgx.ConnConfig {
	port, _ := strconv.Atoi(os.Getenv("DB_PORT"))
	return pgx.ConnConfig{
		Host:     os.Getenv("DB_HOST"),
		Port:     uint16(port),
		Database: os.Getenv("DB_DATABASE"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASS"),
	}
}

func startPostgres(ctx context.Context) (*pgx.ConnPool, error) {
	pool, err := pgx.NewConnPool(pgx.ConnPoolConfig{
		ConnConfig: envPGConfig(),
		AfterConnect: func(c *pgx.Conn) error {
			// Subscribe our connection to the 'pg_notify_trigger_event' channel
			err := c.Listen("pg_notify_trigger_event")
			if err != nil {
				return err
			}
			go func() {
				for {
					// If ctx is done, err will be non-nil and this function will return
					msg, err := c.WaitForNotification(ctx)
					if err != nil {
						util.Log.Errorln(errors.Wrap(err, "WaitForNotification error"))
						return
					}
					notifyPayload := &NotifyPayload{}
					err = json.Unmarshal([]byte(msg.Payload), &notifyPayload)
					util.Log.Debugw("Message received from database",
						"channel", msg.Channel,
						"pid", msg.PID,
						"raw", msg.Payload,
						"payload", notifyPayload,
					)

					util.Log.Infow("Received NOTIFY event from database, performing HTTP post")
					util.PostTriggerAction(postRequestURL, postRequestBody, notifyPayload.Data)
				}
			}()
			return nil
		},
	})
	return pool, err
}
