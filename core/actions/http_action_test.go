package actions

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ==========================================================
// TestHttpAction_RequiredKeys

func TestHttpAction_RequiredKeys(t *testing.T) {
	httpAction := HttpAction{}
	requiredKeys := httpAction.RequiredKeys()

	assert.Equal(t, 2, len(requiredKeys), "Should have 2 required keys")

	// Verify url key
	assert.Equal(t, "url", requiredKeys[0].Name, "First key should be 'url'")
	assert.Equal(t, StringActionKeyType, requiredKeys[0].KeyType, "URL should be string type")

	// Verify method key
	assert.Equal(t, "method", requiredKeys[1].Name, "Second key should be 'method'")
	assert.Equal(t, StringActionKeyType, requiredKeys[1].KeyType, "Method should be string type")
}

// ==========================================================
// TestHttpAction_Validate

func TestHttpAction_Validate_ValidInput(t *testing.T) {
	httpAction := HttpAction{}
	input := Input{
		"url":    "https://example.com/api",
		"method": "GET",
	}

	httpReq, err := httpAction.Validate(input)
	assert.NoError(t, err, "Validate should not error with valid input")
	assert.NotNil(t, httpReq, "HttpActionReq should not be nil")
	assert.Equal(t, "https://example.com/api", httpReq.Url, "URL should match input")
	assert.Equal(t, GetHttpMethod, httpReq.Method, "Method should match input")
}

func TestHttpAction_Validate_WithRequestBody(t *testing.T) {
	httpAction := HttpAction{}
	requestBody := map[string]interface{}{
		"key1": "value1",
		"key2": 123,
	}
	input := Input{
		"url":          "https://example.com/api",
		"method":       "POST",
		"request_body": requestBody,
	}

	httpReq, err := httpAction.Validate(input)
	assert.NoError(t, err, "Validate should not error with request body")
	assert.NotNil(t, httpReq.RequestBody, "RequestBody should not be nil")
	assert.Equal(t, requestBody, httpReq.RequestBody, "RequestBody should match input")
}

func TestHttpAction_Validate_MissingUrl(t *testing.T) {
	httpAction := HttpAction{}
	input := Input{
		"method": "GET",
	}

	// This will panic due to type assertion on nil value
	// Documenting current behavior - should be fixed with proper error handling
	assert.Panics(t, func() {
		httpAction.Validate(input)
	}, "Validate panics with missing URL (should return error instead)")
}

func TestHttpAction_Validate_MissingMethod(t *testing.T) {
	httpAction := HttpAction{}
	input := Input{
		"url": "https://example.com/api",
	}

	// This will panic due to type assertion on nil value
	assert.Panics(t, func() {
		httpAction.Validate(input)
	}, "Validate panics with missing method (should return error instead)")
}

// ==========================================================
// TestHttpAction_Execute

func TestHttpAction_Execute_GetRequest(t *testing.T) {
	// Create test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "GET", r.Method, "Should make GET request")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"result": "success",
			"id":     float64(42),
		})
	}))
	defer server.Close()

	httpAction := HttpAction{}
	input := Input{
		"url":    server.URL,
		"method": "GET",
	}

	output, err := httpAction.Execute(input)
	assert.NoError(t, err, "Execute should not error for GET request")
	assert.NotNil(t, output, "Output should not be nil")
	assert.Equal(t, "200", output["status"], "Status should be 200")
	assert.Equal(t, "success", output["result"], "Should parse string field")
	assert.Equal(t, "42", output["id"], "Should convert number to string")
}

func TestHttpAction_Execute_PostRequest(t *testing.T) {
	// Create test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "POST", r.Method, "Should make POST request")

		// Verify request body
		var reqBody map[string]interface{}
		err := json.NewDecoder(r.Body).Decode(&reqBody)
		assert.NoError(t, err, "Should decode request body")
		assert.Equal(t, "test_value", reqBody["test_key"], "Request body should match")

		// Send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"created": "true",
			"id":      float64(123),
		})
	}))
	defer server.Close()

	httpAction := HttpAction{}
	input := Input{
		"url":    server.URL,
		"method": "POST",
		"request_body": map[string]interface{}{
			"test_key": "test_value",
		},
	}

	output, err := httpAction.Execute(input)
	assert.NoError(t, err, "Execute should not error for POST request")
	assert.NotNil(t, output, "Output should not be nil")
	assert.Equal(t, "200", output["status"], "Status should be 200")
	assert.Equal(t, "true", output["created"], "Should parse response field")
	assert.Equal(t, "123", output["id"], "Should convert response number")
}

func TestHttpAction_Execute_StatusCode(t *testing.T) {
	testCases := []struct {
		name           string
		statusCode     int
		expectedStatus string
	}{
		{"200 OK", http.StatusOK, "200"},
		{"201 Created", http.StatusCreated, "201"},
		{"400 Bad Request", http.StatusBadRequest, "400"},
		{"404 Not Found", http.StatusNotFound, "404"},
		{"500 Internal Server Error", http.StatusInternalServerError, "500"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tc.statusCode)
				// Use "result" instead of "status" to avoid field name conflict
				json.NewEncoder(w).Encode(map[string]interface{}{"result": "ok"})
			}))
			defer server.Close()

			httpAction := HttpAction{}
			input := Input{
				"url":    server.URL,
				"method": "GET",
			}

			output, err := httpAction.Execute(input)
			assert.NoError(t, err, "Execute should not error")
			assert.Equal(t, tc.expectedStatus, output["status"], "Status code should match")
		})
	}
}

func TestHttpAction_Execute_InvalidUrl(t *testing.T) {
	httpAction := HttpAction{}
	input := Input{
		"url":    "://invalid-url",
		"method": "GET",
	}

	output, err := httpAction.Execute(input)
	assert.Error(t, err, "Execute should error with invalid URL")
	assert.Nil(t, output, "Output should be nil on error")
}

func TestHttpAction_Execute_NetworkError(t *testing.T) {
	httpAction := HttpAction{}
	input := Input{
		"url":    "http://localhost:99999", // Invalid port
		"method": "GET",
	}

	output, err := httpAction.Execute(input)
	assert.Error(t, err, "Execute should error with network error")
	assert.Nil(t, output, "Output should be nil on network error")
}

func TestHttpAction_Execute_NonJsonResponse(t *testing.T) {
	// Create test server that returns non-JSON
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte("This is plain text, not JSON"))
	}))
	defer server.Close()

	httpAction := HttpAction{}
	input := Input{
		"url":    server.URL,
		"method": "GET",
	}

	output, err := httpAction.Execute(input)
	assert.Error(t, err, "Execute should error with non-JSON response")
	assert.Nil(t, output, "Output should be nil when JSON parsing fails")
}

func TestHttpAction_Execute_EmptyResponse(t *testing.T) {
	// Create test server that returns empty JSON object
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{})
	}))
	defer server.Close()

	httpAction := HttpAction{}
	input := Input{
		"url":    server.URL,
		"method": "GET",
	}

	output, err := httpAction.Execute(input)
	assert.NoError(t, err, "Execute should not error with empty JSON")
	assert.NotNil(t, output, "Output should not be nil")
	assert.Equal(t, "200", output["status"], "Should still have status")
	assert.Equal(t, 1, len(output), "Should only have status field")
}

func TestHttpAction_Execute_ComplexJsonResponse(t *testing.T) {
	// Create test server with response containing only supported types
	// Note: convertResp only handles string, int, and float64
	// Other types (bool, null, arrays, objects) cause panics in type assertions
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"string_field": "test",
			"int_field":    float64(42),
			"float_field":  float64(3.14),
		})
	}))
	defer server.Close()

	httpAction := HttpAction{}
	input := Input{
		"url":    server.URL,
		"method": "GET",
	}

	output, err := httpAction.Execute(input)
	assert.NoError(t, err, "Execute should not error")
	assert.NotNil(t, output, "Output should not be nil")

	// Verify converted fields
	assert.Equal(t, "200", output["status"], "Should have status")
	assert.Equal(t, "test", output["string_field"], "Should convert string")
	assert.Equal(t, "42", output["int_field"], "Should convert int to string")
	assert.Equal(t, "3", output["float_field"], "Should convert float to int string")

	// Current implementation only handles string, int, and float64
	// bool, null, arrays, and objects will cause type assertion panics
}

// ==========================================================
// TestHttpAction_convertResp

func TestHttpAction_convertResp_TypeConversions(t *testing.T) {
	testCases := []struct {
		name           string
		responseData   map[string]interface{}
		expectedOutput map[string]interface{}
	}{
		{
			name: "string values",
			responseData: map[string]interface{}{
				"field1": "value1",
				"field2": "value2",
			},
			expectedOutput: map[string]interface{}{
				"status": "200",
				"field1": "value1",
				"field2": "value2",
			},
		},
		{
			name: "integer values",
			responseData: map[string]interface{}{
				"count": float64(42),
				"total": float64(100),
			},
			expectedOutput: map[string]interface{}{
				"status": "200",
				"count":  "42",
				"total":  "100",
			},
		},
		{
			name: "float values",
			responseData: map[string]interface{}{
				"price":  float64(19.99),
				"rating": float64(4.5),
			},
			expectedOutput: map[string]interface{}{
				"status": "200",
				"price":  "19",
				"rating": "4",
			},
		},
		{
			name: "mixed types",
			responseData: map[string]interface{}{
				"name":  "product",
				"count": float64(10),
				"price": float64(29.99),
			},
			expectedOutput: map[string]interface{}{
				"status": "200",
				"name":   "product",
				"count":  "10",
				"price":  "29",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Create test server
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(tc.responseData)
			}))
			defer server.Close()

			httpAction := HttpAction{}
			input := Input{
				"url":    server.URL,
				"method": "GET",
			}

			output, err := httpAction.Execute(input)
			require.NoError(t, err, "Execute should not error")

			// Verify all expected fields
			for key, expectedValue := range tc.expectedOutput {
				assert.Equal(t, expectedValue, output[key], "Field %s should match", key)
			}
		})
	}
}

// ==========================================================
// TestHttpAction_Integration

func TestHttpAction_Integration_RealWorldScenario(t *testing.T) {
	// Simulate a real API endpoint
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify headers and method
		assert.Equal(t, "POST", r.Method, "Should be POST")

		// Parse request
		var reqData map[string]interface{}
		json.NewDecoder(r.Body).Decode(&reqData)

		// Send realistic response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":      float64(12345),
			"message": "Resource created successfully",
			"success": "true",
		})
	}))
	defer server.Close()

	httpAction := HttpAction{}
	input := Input{
		"url":    server.URL + "/api/resource",
		"method": "POST",
		"request_body": map[string]interface{}{
			"name":        "Test Resource",
			"description": "Test Description",
		},
	}

	output, err := httpAction.Execute(input)
	assert.NoError(t, err, "Integration test should succeed")
	assert.Equal(t, "201", output["status"], "Should return 201 Created")
	assert.Equal(t, "12345", output["id"], "Should return created resource ID")
	assert.Equal(t, "Resource created successfully", output["message"], "Should return success message")
	assert.Equal(t, "true", output["success"], "Should return success flag")
}
