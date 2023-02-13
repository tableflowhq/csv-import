package services

import (
	"encoding/json"
	"github.com/dgraph-io/badger/v3"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"inquery/go/pkg/db"
	"inquery/go/pkg/util"
	"net/http"
	"strings"
)

type ObjectID struct {
	ID string `json:"id"`
}

func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "ok",
	})
}

func ConnectionGet(c *gin.Context) {
	connConfig, err := GetDatabaseConnectionConfig()
	if err != nil {
		if err != badger.ErrKeyNotFound {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "error retrieving connection", "error": err.Error()})
			return
		}
	}
	if connConfig == nil {
		connConfig = &ConnConfig{}
	}
	c.JSON(http.StatusOK, connConfig)
}

func ConnectionCreate(c *gin.Context) {
	connConfig := ConnConfig{}
	if err := c.BindJSON(&connConfig); err != nil {
		util.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "invalid json body", "error": err.Error()})
		return
	}
	connConfigJson, err := json.Marshal(&connConfig)
	if err != nil {
		util.Log.Warnw("Could not marshal JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "could not marshal connection object", "error": err.Error()})
		return
	}
	if ok, _ := db.DB.Has(db.NamespaceConnections, db.DefaultConnectionName); ok {
		util.Log.Warnw("Attempted to create connection that already exists")
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "connection already exists", "error": "connection already exists"})
		return
	}
	if err = TestDatabaseConnection(&connConfig); err != nil {
		util.Log.Warnw("Could not connect to database for connection creation")
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "connection failed", "error": err.Error()})
		return
	}
	if err = db.DB.Set(db.NamespaceConnections, db.DefaultConnectionName, connConfigJson); err != nil {
		util.Log.Warnw("Error creating connection", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "error creating connection", "error": err.Error()})
		return
	}
	if err = InitEventListener(ShutdownCtx, &connConfig); err != nil {
		util.Log.Errorw("Could not initialize event listener", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "error initializing event listener", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "connection created",
	})
}

func ConnectionDelete(c *gin.Context) {
	if err := db.DB.Delete(db.NamespaceConnections, db.DefaultConnectionName); err != nil {
		util.Log.Warnw("Error deleting connection", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "error deleting connection", "error": err.Error()})
		return
	}
	// TODO: Shutdown event listener on connection delete
	c.JSON(http.StatusOK, gin.H{
		"message": "connection deleted",
	})
}

func ActionCreate(c *gin.Context) {
	action := TriggerAction{}
	if err := c.BindJSON(&action); err != nil {
		util.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "invalid json body", "error": err.Error()})
		return
	}
	actionJson, err := json.Marshal(&action)
	if err != nil {
		util.Log.Warnw("Could not marshal JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "could not marshal connection object", "error": err.Error()})
		return
	}
	isPostRequestBodyValidJSON := util.IsValidJSON(action.Action.Body) || len(action.Action.Body) == 0
	if !isPostRequestBodyValidJSON {
		util.Log.Infow("Invalid request body JSON when creating action")
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "error creating action", "error": "request body must be valid JSON or empty"})
		return
	}
	if len(action.Table) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "no table provided", "error": "no table provided"})
		return
	}
	if len(action.Schema) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "no schema provided", "error": "no schema provided"})
		return
	}
	if len(action.TriggerEvents) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "no trigger events provided", "error": "no trigger events provided"})
		return
	}
	if len(action.Action.URL) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "no URL provided", "error": "no URL provided"})
		return
	}
	// Create db trigger if one does not already exist (handled by the SQL using `if not exists`)
	_, err = ConnPool.Exec(util.GetTriggerCreationSQL(action.Schema, action.Table))
	if err != nil {
		util.Log.Warnw("Could not create database trigger", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "could not create database trigger", "error": err.Error()})
		return
	}
	actionId := uuid.New().String()
	if err = db.DB.Set(db.NamespaceActions, actionId, actionJson); err != nil {
		util.Log.Warnw("Error creating action", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "error creating action", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "ok",
		"id":      actionId,
	})
}

func ActionList(c *gin.Context) {
	actions := make(map[string]TriggerAction)
	actionsData, err := db.DB.Find(db.NamespaceActions)
	if err != nil {
		c.JSON(http.StatusOK, actions)
		return
	}
	for key, actionData := range actionsData {
		action := TriggerAction{}
		if jsonErr := json.Unmarshal(actionData, &action); jsonErr != nil {
			util.Log.Errorw("Could no unmarshal action data", "error", jsonErr)
			continue
		}
		id := strings.Split(key, "/")[1]
		actions[id] = action
	}
	c.JSON(http.StatusOK, actions)
}

func ActionDelete(c *gin.Context) {
	id := ObjectID{}
	if err := c.BindJSON(&id); err != nil {
		util.Log.Warnw("Could not bind JSON", "error", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "invalid json body", "error": err.Error()})
		return
	}

	// Lookup action to see if exists
	actionToDeleteData, err := db.DB.Get(db.NamespaceActions, id.ID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "action does not exist", "error": err.Error()})
		return
	}
	actionToDelete := TriggerAction{}
	if jsonErr := json.Unmarshal(actionToDeleteData, &actionToDelete); jsonErr != nil {
		util.Log.Errorw("Could no unmarshal action data", "error", jsonErr)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "could not unmarshal action data", "error": err.Error()})
		return
	}
	// Get all actions
	// If this is the last action for the table, delete the underlying database trigger
	actionsData, err := db.DB.Find(db.NamespaceActions)
	if err != nil {
		util.Log.Warnw("Error deleting action, could not look up existing actions", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "error deleting action, could not look up existing actions", "error": err.Error()})
		return
	}
	shouldDeleteDatabaseTrigger := true
	for key, actionData := range actionsData {
		a := TriggerAction{}
		if jsonErr := json.Unmarshal(actionData, &a); jsonErr != nil {
			util.Log.Errorw("Could no unmarshal action data", "error", jsonErr)
			continue
		}
		actionId := strings.Split(key, "/")[1]
		if actionId == id.ID {
			// Move on so the action that will be deleted is not considered for deleting the database trigger
			continue
		}
		if actionToDelete.Table == a.Table && actionToDelete.Schema == a.Schema {
			shouldDeleteDatabaseTrigger = false
			break
		}
	}
	if err = db.DB.Delete(db.NamespaceActions, id.ID); err != nil {
		util.Log.Warnw("Error deleting action", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "error deleting action", "error": err.Error()})
		return
	}
	// If no other actions exist with same schema/table, delete the underlying database trigger
	if shouldDeleteDatabaseTrigger {
		_, err = ConnPool.Exec(util.GetTriggerDropSQL(actionToDelete.Schema, actionToDelete.Table))
		if err != nil {
			util.Log.Warnw("Could not drop database triggers", "error", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "could not drop database triggers", "error": err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "action deleted",
	})
}

func TableList(c *gin.Context) {
	tables := make(map[string][]string)
	rows, err := ConnPool.Query("select schemaname, tablename from pg_catalog.pg_tables where schemaname not in ('pg_catalog', 'information_schema');")
	if err != nil {
		util.Log.Warnw("Error listing tables", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "could not list tables", "error": err.Error()})
		return
	}
	for rows.Next() {
		var schemaName string
		var tableName string
		if err := rows.Scan(&schemaName, &tableName); err != nil {
			continue
		}
		tables[schemaName] = append(tables[schemaName], tableName)
	}
	c.JSON(http.StatusOK, tables)
}
