package util

import (
	"bytes"
	"encoding/json"
	"net/http"
)

func JsonPrettyPrint(in string) string {
	var out bytes.Buffer
	err := json.Indent(&out, []byte(in), "", "\t")
	if err != nil {
		return in
	}
	return out.String()
}

func PostSlackMessage(message, webhookURL string) {
	values := map[string]string{"text": message}
	jsonValue, _ := json.Marshal(values)
	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(jsonValue))
	if err != nil {
		Log.Error(err)
	}
	defer resp.Body.Close()
}
