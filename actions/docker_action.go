package actions

type (
	DockerAction struct{}
)

func (dockerAction DockerAction) RequiredKeys() (keys []ActionKey) {
	keys = []ActionKey{
		ActionKey{"slack_api_token", StringActionKeyType},
		ActionKey{"channel_id", StringActionKeyType},
		ActionKey{"message", StringActionKeyType},
	}
	return
}

func (dockerAction DockerAction) Validate(input Input) (err error) {
	return
}

func (dockerAction DockerAction) Execute(input Input) (output Output, err error) {

	if err = dockerAction.Validate(input); err != nil {
		return
	}
	return
}
