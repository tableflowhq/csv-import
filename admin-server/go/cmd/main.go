package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"tableflow/go/pkg/auth"
	"tableflow/go/pkg/db"
	"tableflow/go/pkg/env"
	"tableflow/go/pkg/slack"
	"tableflow/go/pkg/util"
	"tableflow/go/services"
	"tableflow/go/services/file"
	"tableflow/go/services/s3"
	"tableflow/go/services/web"
)

func main() {
	services.ShutdownCtx, services.ShutdownCancelFunc = context.WithCancel(context.Background())
	var err error

	/* Logger */
	err = util.InitLogger()
	if err != nil {
		util.Log.Fatalw("Error initializing logger", "error", err.Error())
		return
	}

	/* Environment */
	err = env.InitEnv()
	if err != nil {
		util.Log.Errorw("Error loading initializing env", "error", err.Error())
		return
	}

	/* Slack */
	err = slack.InitSlack()
	if err != nil {
		util.Log.Errorw("Error initializing Slack", "error", err.Error())
		return
	}

	/* SuperTokens */
	err = auth.InitAuth()
	if err != nil {
		util.Log.Fatalw("Error initializing SuperTokens", "error", err.Error())
		return
	}

	/* Postgres */
	err = db.InitDatabase()
	if err != nil {
		util.Log.Fatalw("Error initializing database", "error", err.Error())
		return
	}

	/* S3 */
	err = s3.InitS3()
	if err != nil {
		util.Log.Fatalw("Error initializing S3", "error", err.Error())
		return
	}

	/* Temp Storage */
	services.ShutdownWaitGroup.Add(1)
	err = file.InitTempStorage(services.ShutdownCtx)
	if err != nil {
		util.Log.Fatalw("Error initializing temp storage", "error", err.Error())
		return
	}

	/* Web Server */
	services.ShutdownWaitGroup.Add(1)
	err = web.InitWebServer(services.ShutdownCtx)
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
