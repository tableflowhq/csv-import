package util

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
)

func JsonPrettyPrint(in string) string {
	var out bytes.Buffer
	err := json.Indent(&out, []byte(in), "", "\t")
	if err != nil {
		return in
	}
	return out.String()
}

func IsValidJSON(str string) bool {
	var js json.RawMessage
	return json.Unmarshal([]byte(str), &js) == nil
}

func FillTemplateValues(template string, values map[string]interface{}) string {
	result := template
	rex := regexp.MustCompile(`\${(\w+)}`)
	matches := rex.FindAllStringSubmatch(template, -1)
	for _, match := range matches {
		token := match[0]
		tokenValue := match[1]
		// Replace the value even if it doesn't exist in the values map
		value, exists := values[tokenValue]
		if !exists {
			value = ""
		}
		result = strings.ReplaceAll(result, token, fmt.Sprintf("%v", value))
	}
	return result
}

func PostTriggerAction(postRequestURL, postRequestBodyTemplate string, templateValues map[string]interface{}) {
	postRequestBody := FillTemplateValues(postRequestBodyTemplate, templateValues)
	resp, err := http.Post(postRequestURL, "application/json", bytes.NewBuffer([]byte(postRequestBody)))
	if err != nil {
		Log.Errorw("An error occurred making the POST request",
			"url", postRequestURL,
			"error", err,
		)
	}
	defer resp.Body.Close()
}
