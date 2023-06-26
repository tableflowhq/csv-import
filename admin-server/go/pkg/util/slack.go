package util

import (
	"errors"
	"fmt"
	"os"
)

type SlackMessage struct {
	Text        string            `json:"text"`
	Markdown    bool              `json:"mrkdwn"`
	Attachments []SlackAttachment `json:"attachments,omitempty"`
}

type SlackAttachment struct {
	Text string `json:"text"`
}

type SlackChannel string

const (
	SlackChannelNewUsers SlackChannel = "auto-new-users"
)

var slackChannels = map[SlackChannel]string{
	SlackChannelNewUsers: os.Getenv("SLACK_WEBHOOK_NEW_USERS"),
}

func SendSlackMessage(channel SlackChannel, message string) error {
	payload := SlackMessage{
		Text:     message,
		Markdown: true,
	}
	url, ok := slackChannels[channel]
	if !ok {
		return errors.New(fmt.Sprintf("slack channel %v not found", channel))
	}
	err := HTTPRequest(
		url,
		"POST",
		payload,
		map[string]string{"Content-Type": "application/json"},
	)
	if err != nil {
		Log.Errorw("Error sending Slack message", "error", err)
		return err
	}
	return nil
}
