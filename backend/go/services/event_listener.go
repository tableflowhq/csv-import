package services

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/jackc/pgx"
	"inquery/go/pkg/db"
	"inquery/go/pkg/util"
	"time"
)

const defaultListenChannel = "pg_notify_trigger_event"

var initialized bool

type ConnConfig struct {
	Host     string `json:"host"`
	Port     uint16 `json:"port"`
	Database string `json:"database"`
	User     string `json:"user"`
	Password string `json:"password"`
}

type NotifyPayload struct {
	Table  string                 `json:"table"`
	Schema string                 `json:"schema"`
	Event  string                 `json:"event"`
	New    map[string]interface{} `json:"new"`
	Old    map[string]interface{} `json:"old"`
	User   string                 `json:"user"`
}

var ConnPool *pgx.ConnPool

func InitEventListener(ctx context.Context, ccfg *ConnConfig) (err error) {
	if initialized {
		return
	}
	initialized = true
	// TODO: Add logic to reconnect if connection fails if pgx does not do this automatically
	pgxConnConfig := pgx.ConnConfig{
		Host:     ccfg.Host,
		Port:     ccfg.Port,
		Database: ccfg.Database,
		User:     ccfg.User,
		Password: ccfg.Password,
	}
	ConnPool, err = pgx.NewConnPool(pgx.ConnPoolConfig{
		ConnConfig:     pgxConnConfig,
		MaxConnections: 3,
		AcquireTimeout: 30 * time.Second,
	})
	if err != nil {
		return err
	}
	util.Log.Debugw("Connected to database", "name", ccfg.Database)
	go listen(ctx)
	return nil
}

func listen(ctx context.Context) {
	conn, err := ConnPool.Acquire()
	if err != nil {
		util.Log.Errorw("Could not acquire database connection to LISTEN", "error", err)
		return
	}
	defer func(conn *pgx.Conn) {
		ConnPool.Release(conn)
		// TODO: Handle ConnPool management elsewhere
		ConnPool.Close()
		ShutdownWaitGroup.Done()
	}(conn)
	err = conn.Listen(defaultListenChannel)
	if err != nil {
		util.Log.Errorw("Could not establish LISTEN/NOTIFY channel", "error", err, "channel", defaultListenChannel)
		return
	}
	util.Log.Debugw("Event listener started")
	for {
		// If ctx is done, err will be non-nil and this function will return
		msg, err := conn.WaitForNotification(ctx)
		if err != nil {
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
			"schema", notifyPayload.Schema,
			"table", notifyPayload.Table,
			"event", notifyPayload.Event,
		)
		go HandleNotifyEventReceived(notifyPayload)
	}
}

func GetDatabaseConnectionConfig() (*ConnConfig, error) {
	// TODO: Modify to support multiple database connection configs using a UUID key
	val, err := db.DB.Get(db.NamespaceConnections, db.DefaultConnectionName)
	if err != nil {
		return nil, err
	}
	connConfig := ConnConfig{}
	err = json.Unmarshal(val, &connConfig)
	if err != nil {
		return nil, err
	}
	return &connConfig, nil
}

func TestDatabaseConnection(ccfg *ConnConfig) error {
	pgxConnConfig := pgx.ConnConfig{
		Host:     ccfg.Host,
		Port:     ccfg.Port,
		Database: ccfg.Database,
		User:     ccfg.User,
		Password: ccfg.Password,
	}
	conn, err := pgx.Connect(pgxConnConfig)
	if err != nil {
		return err
	}
	if !conn.IsAlive() {
		return errors.New("connection error")
	}
	err = conn.Close()
	if err != nil {
		return err
	}
	return nil
}
