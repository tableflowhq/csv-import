package util

import (
	"bytes"
	"encoding/json"
	"fmt"
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

// FillTemplateValues replaces template keys with the provided values
// Format examples: ${name} ${new.name} ${old.name}
func FillTemplateValues(template string, values map[string]interface{}) string {
	result := template
	rex := regexp.MustCompile(`\${(\w+|\w+\.\w+)}`)
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
