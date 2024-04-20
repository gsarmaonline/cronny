package actions

import (
	"log"
)

type (
	LoggerAction struct {
	}
)

func (loggerAction LoggerAction) Execute(input Input) (output Output, err error) {
	log.Println("From Logger action", input)
	return
}
