package actions

import (
	"context"
	"log"

	"github.com/slack-go/slack"
)

type (
	SlackMessageAction struct{}
)

func (slackMsgAction SlackMessageAction) Validate(input Input) {
	return
}

func (slackMsgAction SlackMessageAction) Execute(input Input) (output Output, err error) {
	// Create a new Slack client
	token := input["slack_api_token"]
	client := slack.New(token)

	// Post a message to a channel
	channelID := input["channel_id"]
	message := input["message"]

	if _, _, err = client.PostMessageContext(context.Background(), channelID, slack.MsgOptionText(message, false)); err != nil {
		log.Println("Failed to post slack message", err)
	}
	return
}
