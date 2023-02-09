package services

import (
	"context"
	"db-webhooks/go/pkg/util"
	"sync"
)

func InitActionHandler(ctx context.Context, wg *sync.WaitGroup) error {
	// TODO: Use a persistent queue for handling events
	util.Log.Debugw("Action handler started")
	go func() {
		defer wg.Done()
		for {
			select {
			case <-ctx.Done():
				util.Log.Debugw("Action handler shutdown")
				return
			}
		}
	}()
	return nil
}

func HandleNotifyEventReceived(payload NotifyPayload) {
	// Look up actions that exist for table

	//isPostRequestBodyValidJSON := util.IsValidJSON(postRequestBody) || len(postRequestBody) == 0
	//if !isPostRequestBodyValidJSON {
	//	util.Log.Fatalw("Request body must be valid JSON or empty")
	//	return
	//}
}
