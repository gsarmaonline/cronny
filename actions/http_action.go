package actions

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
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
		Url:         input["url"],
		Method:      HttpMethodT(input["method"]),
		RequestBody: input["request_body"],
	}
	return
}

func (httpAction HttpAction) Execute(input Input) (output Output, err error) {
	var (
		client *http.Client
		req    *http.Request
		resp   *http.Response

		reqBody  io.Reader
		respBody []byte
		payloadB []byte

		httpReq *HttpActionReq
	)
	if httpReq, err = httpAction.Validate(input); err != nil {
		return
	}
	log.Println(httpReq)

	client = &http.Client{}
	if payloadB, err = json.Marshal(httpReq.RequestBody); err != nil {
		return
	}
	reqBody = bytes.NewBuffer(payloadB)
	if req, err = http.NewRequest(string(httpReq.Method), httpReq.Url, reqBody); err != nil {
		return
	}
	if resp, err = client.Do(req); err != nil {
		return
	}
	if respBody, err = io.ReadAll(resp.Body); err != nil {
		return
	}
	output = make(Output)
	output["status"] = strconv.Itoa(resp.StatusCode)
	output["response_body"] = string(respBody)

	fmt.Println(output)

	return
}
