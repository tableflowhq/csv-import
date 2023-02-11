package services

import (
	"context"
	"db-webhooks/go/pkg/db"
	"db-webhooks/go/pkg/util"
	"encoding/json"
)

type TriggerAction struct {
	Name          string   `json:"name"`
	Table         string   `json:"table"`
	Schema        string   `json:"schema"`
	TriggerEvents []string `json:"trigger_events"`
	Action        struct {
		Type   string `json:"type"`
		URL    string `json:"url"`
		Method string `json:"method"`
		Body   string `json:"body"`
	} `json:"action"`
}

func InitActionHandler(ctx context.Context) error {
	// TODO: Use a persistent queue for handling events
	util.Log.Debugw("Action handler started")
	go func() {
		defer ShutdownWaitGroup.Done()
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
	if len(payload.Table) == 0 {
		return
	}
	// Look up actions that exist for table
	// TODO: These can be cached in memory
	actionsData, err := db.DB.Find(db.NamespaceActions)
	if err != nil {
		util.Log.Debugw("No trigger actions found", "error", err)
		return
	}
	// Parse action byte data
	var matchedActions []TriggerAction
	for _, actionData := range actionsData {
		action := TriggerAction{}
		if jsonErr := json.Unmarshal(actionData, &action); jsonErr != nil {
			util.Log.Errorw("Could no unmarshal action data", "error", jsonErr)
			continue
		}
		if action.Table != payload.Table {
			continue
		}
		if action.Schema != payload.Schema {
			continue
		}
		// Add the action if the matching table and schema contains a trigger event matching the trigger operation
		for _, triggerEvent := range action.TriggerEvents {
			if payload.Event == triggerEvent {
				matchedActions = append(matchedActions, action)
				break
			}
		}
	}
	for _, action := range matchedActions {
		util.Log.Infow("Found matched action!", "action", action)
		// TODO: *****
	}
}
