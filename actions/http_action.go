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

	HttpActionReq struct {
		Url         string      `json:"url"`
		Method      HttpMethodT `json:"method"`
		RequestBody interface{} `json:"request_body"`
	}

	HttpAction struct {
	}
)

func (HttpAction HttpAction) Validate(input Input) (httpReq *HttpActionReq, err error) {
	httpReq = &HttpActionReq{
		Url:         input["url"].(string),
		Method:      HttpMethodT(input["method"].(string)),
		RequestBody: input["request_body"],
	}
	return
}

func (httpAction HttpAction) Execute(input Input) (output Output, err error) {
	var (
		client *http.Client
		req    *http.Request

		reqBody  io.Reader
		payloadB []byte

		httpReq *HttpActionReq
	)
	if httpReq, err = httpAction.Validate(input); err != nil {
		return
	}
	log.Println(httpReq)

	client = &http.Client{}
	if payloadB, err = json.Marshal(&httpReq.RequestBody); err != nil {
		return
	}
	reqBody = bytes.NewBuffer(payloadB)
	if req, err = http.NewRequest(string(httpReq.Method), httpReq.Url, reqBody); err != nil {
		return
	}
	if _, err = client.Do(req); err != nil {
		return
	}
	return
}
