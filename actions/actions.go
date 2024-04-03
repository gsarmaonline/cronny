package actions

type (
	ActionExecutor interface {
		Execute(Input) (Output, error)
	}

	Input  map[string]string
	Output map[string]string
)
