package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cronny/config"
	"github.com/cronny/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// TestModel is a simple model that embeds BaseModel for testing
type TestModel struct {
	models.BaseModel
	Name string
}

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open in-memory SQLite database: %v", err)
	}
	return db
}

// setupTestContext creates a Gin test context with a recorder for testing
func setupTestContext() (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/", nil)
	return c, w
}

// setupTestContextWithToken creates a Gin test context with a user token for testing
func setupTestContextWithToken(userID uint) (*gin.Context, *httptest.ResponseRecorder) {
	c, w := setupTestContext()
	token := GenerateTestToken(userID)
	c.Request.Header.Set("Authorization", "Bearer "+token)
	return c, w
}

// setupTestContextWithBody creates a Gin test context with a request body for testing
func setupTestContextWithBody(method, url string, body interface{}) (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	jsonData, _ := json.Marshal(body)
	req, _ := http.NewRequest(method, url, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	return c, w
}

// setupAuthenticatedTestContextWithBody creates a Gin test context with a user token and request body
func setupAuthenticatedTestContextWithBody(method, url string, body interface{}, userID uint) (*gin.Context, *httptest.ResponseRecorder) {
	c, w := setupTestContextWithBody(method, url, body)
	token := GenerateTestToken(userID)
	c.Request.Header.Set("Authorization", "Bearer "+token)
	return c, w
}

// setupTestUserInDB creates a test user in the database
func setupTestUserInDB(t *testing.T, db *gorm.DB) *models.User {
	user := &models.User{
		Username:  "testuser",
		Email:     "test@example.com",
		FirstName: "Test",
		LastName:  "User",
	}
	err := db.Create(user).Error
	assert.NoError(t, err, "Failed to create test user")
	return user
}

// setupTestHandler creates a handler with a test database
func setupTestHandler(t *testing.T) (*Handler, *gorm.DB) {
	db := setupTestDB(t)
	handler := &Handler{db: db}
	return handler, db
}

// setupTestRouter creates a router with user middleware for testing
func setupTestRouter(handler *Handler, userID uint) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Add middleware to set user ID in context for testing
	router.Use(func(c *gin.Context) {
		c.Set(UserIDKey, userID)
		c.Next()
	})

	// Add user scope middleware
	router.Use(UserScopeMiddleware(handler.db))

	return router
}

// setupAuthenticatedRouter creates a router with auth middleware for testing
func setupAuthenticatedRouter(handler *Handler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Add auth middleware
	router.Use(AuthMiddleware())

	// Add user scope middleware
	router.Use(UserScopeMiddleware(handler.db))

	return router
}

// setupScheduleTest creates a test environment with a handler and router for schedule tests
func setupScheduleTest(t *testing.T) (*Handler, *gin.Engine) {
	db := setupTestDB(t)

	// Create necessary tables
	db.AutoMigrate(&models.Schedule{}, &models.Action{}, &models.User{})

	handler := &Handler{db: db}

	// Setup router
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Add middleware to set user ID in context for testing
	router.Use(func(c *gin.Context) {
		c.Set(UserIDKey, uint(1)) // Set user ID to 1 for testing
		c.Next()
	})

	// Add user scope middleware
	router.Use(UserScopeMiddleware(db))

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

// GenerateTestToken creates a JWT token for testing purposes
func GenerateTestToken(userID uint) string {
	// Create claims
	claims := jwt.MapClaims{
		"user_id": float64(userID),
		"exp":     time.Now().Add(time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret
	tokenString, _ := token.SignedString([]byte(config.JWTSecret))
	return tokenString
}

// createRequestWithToken creates an HTTP request with an authorization token
func createRequestWithToken(method, url string, body interface{}, userID uint) (*http.Request, *httptest.ResponseRecorder) {
	var req *http.Request

	if body != nil {
		jsonData, _ := json.Marshal(body)
		req, _ = http.NewRequest(method, url, bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, _ = http.NewRequest(method, url, nil)
	}

	// Add authorization header with token
	token := GenerateTestToken(userID)
	req.Header.Set("Authorization", "Bearer "+token)

	return req, httptest.NewRecorder()
}

// performRequest executes a request against a test router
func performRequest(router *gin.Engine, req *http.Request) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

// assertJSONResponse asserts that a response contains expected JSON values
func assertJSONResponse(t *testing.T, w *httptest.ResponseRecorder, status int, expectedValues map[string]interface{}) {
	assert.Equal(t, status, w.Code, fmt.Sprintf("Expected HTTP status %d, got %d", status, w.Code))

	// Parse response
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err, "Failed to parse JSON response")

	// Check expected values
	for key, expectedValue := range expectedValues {
		assert.Equal(t, expectedValue, response[key], fmt.Sprintf("Expected %s to be %v, got %v", key, expectedValue, response[key]))
	}
}
