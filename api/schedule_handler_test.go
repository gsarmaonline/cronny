package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cronny/models"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// setupScheduleTest creates a test environment with a handler and router
func setupScheduleTest(t *testing.T) (*Handler, *gin.Engine) {
	db := setupTestDB(t)

	// Create necessary tables
	db.AutoMigrate(&models.Schedule{}, &models.Action{}, &models.User{})

	handler := &Handler{db: db}

	// Setup router
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Add routes
	router.GET("/schedules", handler.ScheduleIndexHandler)
	router.GET("/schedules/:id", handler.ScheduleShowHandler)
	router.POST("/schedules", handler.ScheduleCreateHandler)
	router.PUT("/schedules/:id", handler.ScheduleUpdateHandler)
	router.DELETE("/schedules/:id", handler.ScheduleDeleteHandler)

	return handler, router
}

// createTestAction creates a test action in the database
func createTestAction(t *testing.T, db *gorm.DB) *models.Action {
	action := &models.Action{
		Name: "Test Action",
	}
	action.SetUserID(1)

	result := db.Create(action)
	assert.NoError(t, result.Error, "Failed to create test action")

	return action
}

// createTestSchedule creates a test schedule in the database
func createTestSchedule(t *testing.T, db *gorm.DB, actionID uint) *models.Schedule {
	schedule := &models.Schedule{
		Name:             "Test Schedule",
		ScheduleExecType: models.AwsExecType,
		ScheduleType:     models.RecurringScheduleType,
		ScheduleValue:    "5",
		ScheduleUnit:     models.MinuteScheduleUnit,
		ScheduleStatus:   models.PendingScheduleStatus,
		ActionID:         actionID,
	}
	schedule.SetUserID(1)

	result := db.Create(schedule)
	assert.NoError(t, result.Error, "Failed to create test schedule")

	return schedule
}

func TestScheduleIndexHandler(t *testing.T) {
	// Setup
	handler, router := setupScheduleTest(t)

	// Create test data
	action := createTestAction(t, handler.db)
	_ = createTestSchedule(t, handler.db, action.ID)
	_ = createTestSchedule(t, handler.db, action.ID)

	// Create request
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/schedules", nil)
	router.ServeHTTP(w, req)

	// Assert response
	assert.Equal(t, http.StatusOK, w.Code)

	// Parse response
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Verify response contains schedules
	schedules, ok := response["schedules"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, schedules, 2)

	// Verify message
	assert.Equal(t, "success", response["message"])
}

func TestScheduleShowHandler(t *testing.T) {
	// Setup
	handler, router := setupScheduleTest(t)

	// Create test data
	action := createTestAction(t, handler.db)
	schedule := createTestSchedule(t, handler.db, action.ID)

	// Test cases
	testCases := []struct {
		name           string
		scheduleID     string
		expectedStatus int
		expectedMsg    string
	}{
		{
			name:           "Valid schedule ID",
			scheduleID:     fmt.Sprintf("%d", schedule.ID),
			expectedStatus: http.StatusOK,
			expectedMsg:    "success",
		},
		{
			name:           "Invalid schedule ID format",
			scheduleID:     "invalid",
			expectedStatus: http.StatusBadRequest,
			expectedMsg:    "Improper ID format",
		},
		{
			name:           "Non-existent schedule ID",
			scheduleID:     "999",
			expectedStatus: http.StatusNotFound,
			expectedMsg:    "Schedule not found",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Create request
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/schedules/"+tc.scheduleID, nil)
			router.ServeHTTP(w, req)

			// Assert response
			assert.Equal(t, tc.expectedStatus, w.Code)

			// Parse response
			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			// Verify message
			assert.Equal(t, tc.expectedMsg, response["message"])

			// If success, verify schedule details
			if tc.expectedStatus == http.StatusOK {
				scheduleResp, ok := response["schedule"].(map[string]interface{})
				assert.True(t, ok)

				// For valid schedule ID, we should have a schedule with the correct name
				// The ID might be returned as a float64 due to JSON unmarshaling
				assert.NotNil(t, scheduleResp)
				assert.Equal(t, schedule.Name, scheduleResp["name"])
			}
		})
	}
}

func TestScheduleCreateHandler(t *testing.T) {
	// Setup
	handler, router := setupScheduleTest(t)

	// Create test action
	action := createTestAction(t, handler.db)

	// Test cases
	testCases := []struct {
		name           string
		requestBody    map[string]interface{}
		expectedStatus int
		expectedMsg    string
	}{
		{
			name: "Valid schedule",
			requestBody: map[string]interface{}{
				"name":           "New Test Schedule",
				"schedule_type":  models.RecurringScheduleType,
				"schedule_value": "10",
				"schedule_unit":  models.MinuteScheduleUnit,
				"action_id":      action.ID,
				"user_id":        1,
			},
			expectedStatus: http.StatusOK,
			expectedMsg:    "success",
		},
		{
			name: "Invalid schedule - missing required fields",
			requestBody: map[string]interface{}{
				"name": "Incomplete Schedule",
				// Missing schedule_type which will cause validation to fail
			},
			expectedStatus: http.StatusInternalServerError,
			expectedMsg:    "ScheduleType not supported",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Create request body
			jsonBody, err := json.Marshal(tc.requestBody)
			assert.NoError(t, err)

			// Create request
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/schedules", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			// Assert response
			assert.Equal(t, tc.expectedStatus, w.Code)

			// Parse response
			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			// Check if message contains expected string
			msg, ok := response["message"].(string)
			assert.True(t, ok)

			if tc.expectedStatus == http.StatusOK {
				assert.Equal(t, tc.expectedMsg, msg)

				// Verify schedule was created
				schedule, ok := response["schedule"].(map[string]interface{})
				assert.True(t, ok)
				assert.Equal(t, tc.requestBody["name"], schedule["name"])

				// Verify default values were set
				assert.Equal(t, float64(models.AwsExecType), schedule["schedule_exec_type"])
				assert.Equal(t, float64(models.InactiveScheduleStatus), schedule["schedule_status"])
			} else {
				assert.Contains(t, msg, tc.expectedMsg)
			}
		})
	}
}

func TestScheduleUpdateHandler(t *testing.T) {
	// Setup
	handler, router := setupScheduleTest(t)

	// Create test data
	action := createTestAction(t, handler.db)
	schedule := createTestSchedule(t, handler.db, action.ID)

	// Test cases
	testCases := []struct {
		name           string
		scheduleID     string
		requestBody    map[string]interface{}
		expectedStatus int
		expectedMsg    string
	}{
		{
			name:       "Valid update",
			scheduleID: fmt.Sprintf("%d", schedule.ID),
			requestBody: map[string]interface{}{
				"name":           "Updated Schedule",
				"schedule_value": "15",
				"schedule_unit":  models.HourScheduleUnit,
			},
			expectedStatus: http.StatusOK,
			expectedMsg:    "success",
		},
		{
			name:       "Invalid schedule ID format",
			scheduleID: "invalid",
			requestBody: map[string]interface{}{
				"name": "Won't Update",
			},
			expectedStatus: http.StatusBadRequest,
			expectedMsg:    "Improper ID format",
		},
		{
			name:       "Non-existent schedule ID",
			scheduleID: "999",
			requestBody: map[string]interface{}{
				"name": "Won't Update",
			},
			expectedStatus: http.StatusBadRequest,
			expectedMsg:    "record not found",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Create request body
			jsonBody, err := json.Marshal(tc.requestBody)
			assert.NoError(t, err)

			// Create request
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/schedules/"+tc.scheduleID, bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			// Assert response
			assert.Equal(t, tc.expectedStatus, w.Code)

			// Parse response
			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			// Verify message
			msg, ok := response["message"].(string)
			assert.True(t, ok)

			if tc.expectedStatus == http.StatusOK {
				assert.Equal(t, tc.expectedMsg, msg)

				// Verify schedule was updated
				scheduleResp, ok := response["schedule"].(map[string]interface{})
				assert.True(t, ok)

				// Check updated fields
				if name, exists := tc.requestBody["name"]; exists {
					assert.Equal(t, name, scheduleResp["name"])
				}

				// Verify in database
				var updatedSchedule models.Schedule
				result := handler.db.First(&updatedSchedule, schedule.ID)
				assert.NoError(t, result.Error)

				if name, exists := tc.requestBody["name"]; exists {
					assert.Equal(t, name, updatedSchedule.Name)
				}
			} else {
				assert.Contains(t, msg, tc.expectedMsg)
			}
		})
	}
}

func TestScheduleDeleteHandler(t *testing.T) {
	// Setup
	handler, router := setupScheduleTest(t)

	// Test cases
	testCases := []struct {
		name           string
		setupFunc      func() uint
		scheduleID     string
		expectedStatus int
		expectedMsg    string
	}{
		{
			name: "Valid delete",
			setupFunc: func() uint {
				action := createTestAction(t, handler.db)
				schedule := createTestSchedule(t, handler.db, action.ID)
				return schedule.ID
			},
			scheduleID:     "", // Will be set dynamically
			expectedStatus: http.StatusOK,
			expectedMsg:    "success",
		},
		{
			name:           "Invalid schedule ID format",
			setupFunc:      func() uint { return 0 },
			scheduleID:     "invalid",
			expectedStatus: http.StatusBadRequest,
			expectedMsg:    "Improper ID format",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Setup test data if needed
			id := tc.setupFunc()
			scheduleID := tc.scheduleID
			if scheduleID == "" {
				scheduleID = fmt.Sprintf("%d", id)
			}

			// Create request
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("DELETE", "/schedules/"+scheduleID, nil)
			router.ServeHTTP(w, req)

			// Assert response
			assert.Equal(t, tc.expectedStatus, w.Code)

			// Parse response
			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			// Verify message
			assert.Equal(t, tc.expectedMsg, response["message"])

			// If success, verify schedule was deleted
			if tc.expectedStatus == http.StatusOK && id > 0 {
				var count int64
				handler.db.Model(&models.Schedule{}).Where("id = ?", id).Count(&count)
				assert.Equal(t, int64(0), count, "Schedule should be deleted from database")
			}
		})
	}
}
