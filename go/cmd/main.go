package main

import (
	"context"
	"db-webhooks/go/pkg/db"
	"db-webhooks/go/pkg/util"
	"db-webhooks/go/services"
	"encoding/json"
	"github.com/dgraph-io/badger/v3"
	"github.com/joho/godotenv"
	"os"
	"os/signal"
	"sync"
	"syscall"
)

func main() {
	shutdownWaitGroup := sync.WaitGroup{}
	ctx, cancel := context.WithCancel(context.Background())

	/* Logger and ENV */
	util.InitLogger()
	envErr := godotenv.Load()
	if envErr != nil {
		util.Log.Warnw("Could not load .env file", "error", envErr)
	}

	/* BadgerDB */
	shutdownWaitGroup.Add(1)
	err := db.InitBadgerDB(ctx, &shutdownWaitGroup)
	if err != nil {
		util.Log.Fatalw("Error initializing BadgerDB", "error", err)
		return
	}

	testConnConfig := services.PostgresConnConfig{
		Host:     "localhost",
		Port:     5432,
		Database: "postgres",
		User:     "user",
		Password: "password",
	}
	testConnConfigJson, err := json.Marshal(&testConnConfig)
	if err != nil {
		util.Log.Error(err)
	}
	err = db.DB.Set(db.NamespaceConnections, "postgres", testConnConfigJson)
	if err != nil {
		util.Log.Error(err)
	}
	//
	//err = db.DB.Delete(db.NamespaceConnections, "postgres")
	//if err != nil {
	//	util.Log.Error(err)
	//}
	//
	//values, err := db.DB.Find("connections")
	//if err != nil {
	//	util.Log.Debugw("Could not find connections", "error", err)
	//}
	//for k, v := range values {
	//	tmp := PostgresConnConfig{}
	//	json.Unmarshal(v, &tmp)
	//	util.Log.Infow("connection value", "key", k, "value", tmp)
	//}

	// Check if the database configuration has been set up
	connConfig, err := getDatabaseConnConfig()
	if err != nil {
		// No connection config exists, wait to start the event listener until this is added
		if err == badger.ErrKeyNotFound {
			util.Log.Debugw("Database connection config does not exist yet, waiting to start event listener")
		} else {
			util.Log.Fatalw("Could not retrieve database connection config", "error", err)
			return
		}
	}

	/* Event Listener */
	if connConfig != nil {
		// Start the event listener only if a connection config already exists
		shutdownWaitGroup.Add(1)
		err = services.InitEventListener(ctx, &shutdownWaitGroup)

		if err != nil {
			util.Log.Fatalw("Error initializing database event listener", "error", err)
			return
		}
	}

	/* Action Handler */
	shutdownWaitGroup.Add(1)
	err = services.InitActionHandler(ctx, &shutdownWaitGroup)
	if err != nil {
		util.Log.Fatalw("Error initializing action handler", "error", err)
		return
	}

	/* Web Server */
	shutdownWaitGroup.Add(1)
	err = services.InitWebServer(ctx, &shutdownWaitGroup)
	if err != nil {
		util.Log.Fatalw("Error initializing web server", "error", err)
		return
	}

	util.Log.Infow("Services started")
	go func() {
		// Wait for interrupt signal to gracefully shut down services with a timeout
		quit := make(chan os.Signal)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		util.Log.Infow("Shutting down services...")
		cancel()
	}()
	shutdownWaitGroup.Wait()
	util.Log.Infow("Services shutdown")
}

func getDatabaseConnConfig() (*services.PostgresConnConfig, error) {
	// TODO: Modify to support multiple database connection configs using a UUID key
	val, err := db.DB.Get(db.NamespaceConnections, "postgres")
	if err != nil {
		return nil, err
	}
	connConfig := services.PostgresConnConfig{}
	err = json.Unmarshal(val, &connConfig)
	if err != nil {
		return nil, err
	}
	return &connConfig, nil
}
