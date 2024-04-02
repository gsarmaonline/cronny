package actions

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
)

const (
	// Http Methods
	GetHttpMethod  = HttpMethodT("GET")
	PostHttpMethod = HttpMethodT("POST")
)

type (
	HttpMethodT string

	HttpAction struct {
		Url         string      `json:"url"`
		Method      HttpMethodT `json:"method"`
		RequestBody interface{} `json:"request_body"`
	}
)

func (httpAction *HttpAction) Execute(input Input) (output Output, err error) {
	var (
		client *http.Client
		req    *http.Request

		reqBody  io.Reader
		payloadB []byte
	)
	log.Println("In HttpAction")
	client = &http.Client{}
	if payloadB, err = json.Marshal(&httpAction.RequestBody); err != nil {
		return
	}
	reqBody = bytes.NewBuffer(payloadB)
	if req, err = http.NewRequest(string(httpAction.Method), httpAction.Url, reqBody); err != nil {
		return
	}
	if _, err = client.Do(req); err != nil {
		return
	}
	return
}
