package actions

import (
	"context"
	"log"

	"github.com/slack-go/slack"
)

type (
	SlackMessageAction struct{}
)

func (slackMsgAction SlackMessageAction) RequiredKeys() (keys []ActionKey) {
	keys = []ActionKey{
		ActionKey{"slack_api_token", StringActionKeyType},
		ActionKey{"channel_id", StringActionKeyType},
		ActionKey{"message", StringActionKeyType},
	}
	return
}

func (slackMsgAction SlackMessageAction) Validate(input Input) (err error) {
	return
}

func (slackMsgAction SlackMessageAction) Execute(input Input) (output Output, err error) {

	if err = slackMsgAction.Validate(input); err != nil {
		return
	}
	// Create a new Slack client
	token := input["slack_api_token"].(string)
	client := slack.New(token)

	// Post a message to a channel
	channelID := input["channel_id"].(string)
	message := input["message"].(string)

	if _, _, err = client.PostMessageContext(context.Background(), channelID, slack.MsgOptionText(message, false)); err != nil {
		log.Println("Failed to post slack message", err)
	}
	return
}
