package main

import (
	"context"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"tableflow/go/internal/service"
	"tableflow/go/pkg/tf"
)

func main() {
	shutdownCtx, shutdownCancelFunc := context.WithCancel(context.Background())
	var shutdownWaitGroup sync.WaitGroup

	service.InitServices(shutdownCtx, &shutdownWaitGroup)

	tf.Log.Infow("Services started")
	go func() {
		// Wait for interrupt signal to gracefully shut down services with a timeout
		quit := make(chan os.Signal)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		tf.Log.Infow("Shutting down services...")
		shutdownCancelFunc()
	}()
	shutdownWaitGroup.Wait()
	tf.Log.Infow("Services shutdown")
}
