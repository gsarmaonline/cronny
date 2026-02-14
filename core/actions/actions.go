package actions

import "fmt"

const (
	NumberActionKeyType = ActionKeyT(0)
	StringActionKeyType = ActionKeyT(1)
	FloatActionKeyType  = ActionKeyT(2)
)

type (
	ActionKeyT     uint8
	ActionExecutor interface {
		RequiredKeys() []ActionKey
		Execute(Input) (Output, error)
	}

	Input  map[string]interface{}
	Output map[string]interface{}

	ActionKey struct {
		Name    string
		KeyType ActionKeyT
	}

	BaseAction struct{}
)

func (baseAction BaseAction) Validate(action ActionExecutor, input Input) (err error) {
	for _, actionKey := range action.RequiredKeys() {
		if _, isPresent := input[actionKey.Name]; !isPresent {
			err = fmt.Errorf("Key %s not present in the input", actionKey.Name)
			return
		}
	}
	return
}

func (baseAction BaseAction) Execute(action ActionExecutor, input Input) (output Output, err error) {
	if err = baseAction.Validate(action, input); err != nil {
		return
	}
	if output, err = action.Execute(input); err != nil {
		return
	}
	return
}
