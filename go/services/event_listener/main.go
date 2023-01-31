package main

import (
	"context"
	"encoding/json"
	"fmt"
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

type Payload struct {
	Id  string `json:"id"`
	Op  string `json:"op"`
	New struct {
		Id    string `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	} `json:"new"`
	Old struct {
		Id    string `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	} `json:"old"`
	Table string `json:"table"`
}

var slackWebhookURL string

func main() {
	ctx := context.Background()
	util.InitializeLogger()

	envErr := godotenv.Load()
	if envErr != nil {
		util.Log.Fatal("Error loading .env file")
	}
	slackWebhookURL = os.Getenv("SLACK_HOOK_URL")

	pool, poolErr := startPostgres(ctx)
	if poolErr != nil {
		util.Log.Fatalln(poolErr)
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
			// Subscribe our connection to the 'event' channel
			err := c.Listen("event")
			if err != nil {
				return err
			}
			go func() {
				for {
					// If ctx is done, err will be non-nil and this func will return
					msg, err := c.WaitForNotification(ctx)
					if err != nil {
						util.Log.Errorln(errors.Wrap(err, "WaitForNotification error"))
						return
					}
					payload := &Payload{}
					err = json.Unmarshal([]byte(msg.Payload), &payload)
					util.Log.Infow("Message received from database",
						"channel", msg.Channel,
						"pid", msg.PID,
						//"raw", msg.Payload,
						"payload", payload,
					)
					message := fmt.Sprintf("A new user has been created! \nName: %s \nEmail: %s", payload.New.Name, payload.New.Email)
					util.PostSlackMessage(message, slackWebhookURL)
				}
			}()
			return nil
		},
	})
	return pool, err
}
