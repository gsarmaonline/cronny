package actions

import "fmt"

type (
	ActionExecutor interface {
		RequiredKeys() []string
		Execute(Input) (Output, error)
	}

	Input  map[string]interface{}
	Output map[string]interface{}

	BaseAction struct{}
)

func (baseAction BaseAction) Validate(action ActionExecutor, input Input) (err error) {
	for _, keyName := range action.RequiredKeys() {
		if _, isPresent := input[keyName]; !isPresent {
			err = fmt.Errorf("Key %s not present in the input", keyName)
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
