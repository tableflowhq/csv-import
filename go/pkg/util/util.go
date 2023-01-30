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

func PostSlackMessage(message string) {
	values := map[string]string{"text": message}
	jsonValue, _ := json.Marshal(values)
	url := "https://hooks.slack.com/services/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"
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonValue))
	if err != nil {
		Log.Error(err)
	}
	defer resp.Body.Close()
}
