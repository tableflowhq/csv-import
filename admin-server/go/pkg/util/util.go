package util

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"golang.org/x/text/language"
	"golang.org/x/text/message"
	"net/mail"
	"reflect"
	"sort"
	"strings"
	"sync"
	"unicode"
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

func IsValidJSONBytes(bytes []byte) bool {
	var js json.RawMessage
	return json.Unmarshal(bytes, &js) == nil
}

func IsEmailValid(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

func IsBlankUnicode(s string) bool {
	for _, r := range s {
		if !unicode.IsSpace(r) {
			return false
		}
	}
	return true
}

func IsBlankASCII(s string) bool {
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c != ' ' && c != '\t' && c != '\n' && c != '\r' {
			return false
		}
	}
	return true
}

func HasDuplicateValues(m map[string]string) bool {
	tmp := make(map[string]struct{})
	for _, v := range m {
		if _, has := tmp[v]; has {
			return true
		}
		tmp[v] = struct{}{}
	}
	return false
}

func EqualContents[T comparable](list1 []T, list2 []T) bool {
	if len(list1) != len(list2) {
		return false
	}
	elementCount := make(map[T]int)
	for _, element := range list1 {
		elementCount[element]++
	}
	for _, element := range list2 {
		elementCount[element]--
	}
	for _, count := range elementCount {
		if count != 0 {
			return false
		}
	}
	return true
}

func DifferenceBy[T any](list1, list2 []T, equal func(T, T) bool) []T {
	var diff []T
	for _, a := range list1 {
		found := false
		for _, b := range list2 {
			if equal(a, b) {
				found = true
				break
			}
		}
		if !found {
			diff = append(diff, a)
		}
	}
	return diff
}

func DecodeBase64(encodedString string) (string, error) {
	decodedBytes, err := base64.StdEncoding.DecodeString(encodedString)
	if err != nil {
		return "", err
	}
	decodedString := string(decodedBytes)
	return decodedString, nil
}

func CommaFormat(num int64) string {
	p := message.NewPrinter(language.English)
	return p.Sprintf("%d", num)
}

// SafeAccess returns the element at the given index if it exists
func SafeAccess[T any](slice []T, index int) (T, bool) {
	var zeroValue T
	if index < 0 || index >= len(slice) {
		return zeroValue, false
	}
	return slice[index], true
}

func TypeOf(i any) string {
	typeOf := reflect.TypeOf(i)
	if typeOf == nil {
		return "nil"
	}
	return typeOf.String()
}

func MinInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// MapToKeyOrderedSlice converts a map[int]string to a []string such that the resulting
// slice is populated in the ascending order of the map's keys
func MapToKeyOrderedSlice(m map[int]string) []string {
	// 1. Extract keys from the map
	keys := make([]int, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}

	// 2. Sort the keys in ascending order
	sort.Ints(keys)

	// 3. Populate the result slice using the sorted keys
	result := make([]string, len(keys))
	for i, k := range keys {
		result[i] = m[k]
	}

	return result
}

func ShutdownHandler(ctx context.Context, wg *sync.WaitGroup, close func()) {
	defer wg.Done()
	for {
		select {
		case <-ctx.Done():
			close()
			return
		}
	}
}

func SanitizeKey(input string) string {
	// Replace spaces with underscores
	result := strings.ReplaceAll(strings.ToLower(input), " ", "_")
	// Remove non-alphanumeric characters
	result = strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_' {
			return r
		}
		return -1
	}, result)
	return result
}

func ValidateKey(input string) bool {
	for _, r := range input {
		if !(unicode.IsLower(r) || unicode.IsDigit(r) || r == '_') {
			return false
		}
	}
	return true
}
