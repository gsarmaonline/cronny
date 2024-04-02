package actions

type (
	ActionExecutor interface {
		Execute(Input) (Output, error)
	}

	Input  map[string]interface{}
	Output map[string]interface{}
)
