package util

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/hbollon/go-edlib"
	"golang.org/x/text/language"
	"golang.org/x/text/message"
	"math/big"
	"net/mail"
	"reflect"
	"runtime/debug"
	"sort"
	"strings"
	"sync"
	"tableflow/go/pkg/tf"
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
	if s == "" {
		return true
	}
	for _, r := range s {
		if !unicode.IsSpace(r) {
			return false
		}
	}
	return true
}

func IsBlankASCII(s string) bool {
	if s == "" {
		return true
	}
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

func SafeGo(f func(), contextFields ...interface{}) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				// Log all relevant context and stack information
				var fields []interface{}
				fields = append(fields, "panic", r)
				fields = append(fields, "stack", string(debug.Stack()))

				// Add dynamic context fields
				fields = append(fields, contextFields...)

				tf.Log.Errorw("Recovered from panic", fields...)
			}
		}()
		f()
	}()
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

func StringSimilarity(str1 string, str2 string) float32 {
	res, err := edlib.StringsSimilarity(str1, str2, edlib.Levenshtein)
	if err != nil {
		return 0
	} else {
		return res
	}
}

func StringToNumberOrNil(s string) (interface{}, string, error) {
	if IsBlankUnicode(s) {
		return nil, "", nil
	}
	s = strings.TrimSpace(s)
	s = strings.Replace(s, ",", "", -1) // Remove commas
	lower := strings.ToLower(s)

	if lower == "null" || lower == "nil" {
		return nil, "", nil
	}

	// Attempt to convert the string to a big.Int
	if bi, ok := new(big.Int).SetString(s, 10); ok {
		return BigInt{bi}, bi.String(), nil
	}

	// Attempt to convert the string to a big.Float
	f := new(big.Float).SetPrec(256)
	if _, ok := f.SetString(s); ok {
		// Round the number to fit within 256 bits of precision
		f.SetMode(big.ToNearestEven)
		f.SetPrec(256)
		return BigFloat{f}, f.Text('f', -1), nil // Use -1 for maximum precision up to the limit
	}

	// Return an error if the string couldn't be converted to any number type
	return nil, "", fmt.Errorf("failed to convert string to number: %s", s)
}

func StringToBoolOrNil(s string) (*bool, string, error) {
	if IsBlankUnicode(s) {
		return nil, "", nil
	}
	s = strings.TrimSpace(s)
	lower := strings.ToLower(s)

	if lower == "null" || lower == "nil" {
		return nil, "", nil
	}

	res := false
	switch lower {
	case "1", "t", "true":
		res = true
		return &res, "true", nil
	case "0", "f", "false":
		return &res, "false", nil
	}

	return nil, "", fmt.Errorf("failed to convert string to boolean: %s", s)
}

type BigInt struct {
	*big.Int
}

type BigFloat struct {
	*big.Float
}

func (i BigInt) MarshalJSON() ([]byte, error) {
	if i.Int == nil {
		return json.Marshal(nil)
	}
	return []byte(i.Int.String()), nil
}

func (f BigFloat) MarshalJSON() ([]byte, error) {
	if f.Float == nil {
		return json.Marshal(nil)
	}
	return []byte(f.Text('f', -1)), nil
}

func Ptr[T any](v T) *T {
	return &v
}
