package actions

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"reflect"
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

func (httpAction HttpAction) RequiredKeys() (keys []ActionKey) {
	keys = []ActionKey{ActionKey{"url", StringActionKeyType}, ActionKey{"method", StringActionKeyType}}
	return
}

func (httpAction HttpAction) Validate(input Input) (httpReq *HttpActionReq, err error) {
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
		resp   *http.Response

		reqBody  io.Reader
		payloadB []byte

		httpReq *HttpActionReq
	)
	if httpReq, err = httpAction.Validate(input); err != nil {
		return
	}

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
	if output, err = httpAction.convertResp(resp); err != nil {
		return
	}
	return
}

func (httpAction HttpAction) convertResp(resp *http.Response) (output Output, err error) {
	var (
		respMap  map[string]interface{}
		respBody []byte
	)
	if respBody, err = io.ReadAll(resp.Body); err != nil {
		return
	}
	respMap = make(map[string]interface{})
	if err = json.Unmarshal(respBody, &respMap); err != nil {
		return
	}
	output = make(Output)
	output["status"] = strconv.Itoa(resp.StatusCode)
	for mKey, mVal := range respMap {
		valType := reflect.TypeOf(mVal).Kind()
		switch valType {
		case reflect.String:
			output[mKey] = mVal.(string)
		case reflect.Int:
			output[mKey] = strconv.Itoa(mVal.(int))
		case reflect.Float64:
			output[mKey] = strconv.Itoa(int(mVal.(float64)))
		}
	}

	return
}
