package util

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"golang.org/x/text/language"
	"golang.org/x/text/message"
	"net/mail"
	"sync"
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

func IsEmailValid(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
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
