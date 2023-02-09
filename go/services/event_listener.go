package services

import (
	"context"
	"db-webhooks/go/pkg/util"
	"encoding/json"
	"github.com/jackc/pgx"
	"os"
	"strconv"
	"sync"
)

const defaultListenChannel = "pg_notify_trigger_event"

type PostgresConnConfig struct {
	Host     string
	Port     uint16
	Database string
	User     string
	Password string
}

type NotifyPayload struct {
	Table string                 `json:"table"`
	Op    string                 `json:"op"`
	New   map[string]interface{} `json:"new"`
	Old   map[string]interface{} `json:"old"`
}

func getPostgresConnConfig() pgx.ConnConfig {
	port, _ := strconv.Atoi(os.Getenv("DB_PORT"))
	return pgx.ConnConfig{
		Host:     os.Getenv("DB_HOST"),
		Port:     uint16(port),
		Database: os.Getenv("DB_DATABASE"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASS"),
	}
}

func InitEventListener(ctx context.Context, wg *sync.WaitGroup) (err error) {
	// TODO: Add logic to reconnect if connection fails if pgx does not do this automatically
	connConfig := getPostgresConnConfig()
	conn, err := pgx.Connect(connConfig)
	if err != nil {
		return err
	}
	util.Log.Debugw("Connected to database", "name", connConfig.Database, "alive", conn.IsAlive())
	err = conn.Listen(defaultListenChannel)
	if err != nil {
		return err
	}
	go func() {
		defer wg.Done()
		util.Log.Debugw("Event listener started")
		for {
			// If ctx is done, err will be non-nil and this function will return
			msg, err := conn.WaitForNotification(ctx)
			if err != nil {
				if connErr := conn.Close(); connErr != nil {
					util.Log.Errorw("An error occurred closing the database connection", "error", connErr)
				}
				util.Log.Debugw("Event listener shutdown")
				return
			}
			notifyPayload := NotifyPayload{}
			err = json.Unmarshal([]byte(msg.Payload), &notifyPayload)
			if err != nil {
				util.Log.Errorw("Could not unmarshal NOTIFY payload from database", "error", err)
				continue
			}
			util.Log.Debugw("Received NOTIFY event from database, forwarding to action handler",
				"channel", msg.Channel,
				"pid", msg.PID,
				"payload", notifyPayload,
			)
			go HandleNotifyEventReceived(notifyPayload)
		}
	}()
	return nil
}
