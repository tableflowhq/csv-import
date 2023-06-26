package slack

import (
	"errors"
	"fmt"
	"os"
	"tableflow/go/pkg/util"
)

type Message struct {
	Text        string       `json:"text"`
	Markdown    bool         `json:"mrkdwn"`
	Attachments []Attachment `json:"attachments,omitempty"`
}

type Attachment struct {
	Text string `json:"text"`
}

type Channel string

const (
	ChannelNewUsers Channel = "auto-new-users"
)

var slackChannels = map[Channel]string{}
var slackInitialized bool

func InitSlack() error {
	if slackInitialized {
		return errors.New("slack already initialized")
	}
	slackInitialized = true
	slackChannels = map[Channel]string{
		ChannelNewUsers: os.Getenv("SLACK_WEBHOOK_NEW_USERS"),
	}
	return nil
}

func SendMessage(channel Channel, message string) error {
	payload := Message{
		Text:     message,
		Markdown: true,
	}
	url, ok := slackChannels[channel]
	if !ok {
		return errors.New(fmt.Sprintf("slack channel %v not found", channel))
	}
	err := util.HTTPRequest(
		url,
		"POST",
		payload,
		map[string]string{"Content-Type": "application/json"},
	)
	if err != nil {
		util.Log.Errorw("Error sending Slack message", "error", err)
		return err
	}
	return nil
}
