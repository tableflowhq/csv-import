package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"inquery/go/pkg/db"
	"inquery/go/pkg/util"
	"net/http"
)

const (
	triggerActionHTTP  = "HTTP"
	triggerEventInsert = "INSERT"
	triggerEventUpdate = "UPDATE"
	triggerEventDelete = "DELETE"
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
	columnTemplateValues := mergeColumnTemplateValues(payload)
	for _, action := range matchedActions {
		switch action.Action.Type {
		case triggerActionHTTP:
			triggerActionHTTPPOST(action, columnTemplateValues)
			break
		default:
			util.Log.Debugw("Attempted to fire unsupported trigger action", "type", action.Action.Type)
		}
	}
}

// mergeColumnTemplateValues creates a merged map of all available template values.
// The prefixes "new." and "old." can be used if a new (INSERT, UPDATE) or old (UPDATE, DELETE) row is available.
// If a prefix is not specified, the new or old values will be used depending on the event:
// INSERT: ${name} == ${new.name}
// UPDATE: ${name} == ${new.name}
// DELETE: ${name} == ${old.name}
func mergeColumnTemplateValues(payload NotifyPayload) map[string]interface{} {
	columnTemplateValues := make(map[string]interface{})
	if payload.New != nil {
		for k, v := range payload.New {
			columnTemplateValues[fmt.Sprintf("new.%v", k)] = v
		}
	}
	if payload.Old != nil {
		for k, v := range payload.Old {
			columnTemplateValues[fmt.Sprintf("old.%v", k)] = v
		}
	}
	switch payload.Event {
	case triggerEventInsert, triggerEventUpdate:
		for k, v := range payload.New {
			columnTemplateValues[k] = v
		}
		break
	case triggerEventDelete:
		for k, v := range payload.Old {
			columnTemplateValues[k] = v
		}
		break
	}
	// Add metadata values
	columnTemplateValues["meta.table"] = payload.Table
	columnTemplateValues["meta.schema"] = payload.Schema
	columnTemplateValues["meta.event"] = payload.Event
	columnTemplateValues["meta.user"] = payload.User
	return columnTemplateValues
}

func triggerActionHTTPPOST(action TriggerAction, templateValues map[string]interface{}) {
	postRequestBody := util.FillTemplateValues(action.Action.Body, templateValues)
	resp, err := http.Post(action.Action.URL, "application/json", bytes.NewBuffer([]byte(postRequestBody)))
	if err != nil {
		util.Log.Errorw("An error occurred making a trigger action POST request",
			"url", action.Action.URL,
			"error", err,
		)
		return
	}
	if resp != nil {
		defer resp.Body.Close()
	}
}
