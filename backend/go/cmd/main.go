package main

import (
	"context"
	"db-webhooks/go/pkg/db"
	"db-webhooks/go/pkg/util"
	"db-webhooks/go/services"
	"github.com/dgraph-io/badger/v3"
	"github.com/joho/godotenv"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	services.ShutdownCtx, services.ShutdownCancelFunc = context.WithCancel(context.Background())

	/* Logger and ENV */
	util.InitLogger()
	envErr := godotenv.Load()
	if envErr != nil {
		util.Log.Warnw("Could not load .env file", "error", envErr)
	}

	/* BadgerDB */
	services.ShutdownWaitGroup.Add(1)
	err := db.InitBadgerDB(services.ShutdownCtx, &services.ShutdownWaitGroup)
	if err != nil {
		util.Log.Fatalw("Error initializing BadgerDB", "error", err)
		return
	}

	// Check if the database configuration has been set up
	connConfig, err := services.GetDatabaseConnectionConfig()
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
		services.ShutdownWaitGroup.Add(1)
		err = services.InitEventListener(services.ShutdownCtx, connConfig)

		if err != nil {
			util.Log.Fatalw("Error initializing database event listener", "error", err)
			return
		}
	}

	/* Action Handler */
	services.ShutdownWaitGroup.Add(1)
	err = services.InitActionHandler(services.ShutdownCtx)
	if err != nil {
		util.Log.Fatalw("Error initializing action handler", "error", err)
		return
	}

	/* Web Server */
	services.ShutdownWaitGroup.Add(1)
	err = services.InitWebServer(services.ShutdownCtx)
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
		services.ShutdownCancelFunc()
	}()
	services.ShutdownWaitGroup.Wait()
	util.Log.Infow("Services shutdown")
}
