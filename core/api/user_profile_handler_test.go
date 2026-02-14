package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cronny/core/models"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// setupTestUserProfile creates a test environment with necessary data for user profile tests
func setupTestUserProfile(t *testing.T, db *gorm.DB) (*gin.Engine, *Handler, *models.User) {
	// Create test tables
	db.AutoMigrate(&models.User{}, &models.Plan{}, &models.Feature{})

	// Create test plans
	plan1 := &models.Plan{
		Name:        "Basic Plan",
		Description: "Basic features",
		Price:       9.99,
	}
	// Since Plan doesn't embed BaseModel, we can't use SetUserID
	// We need to set directly in the database
	db.Create(plan1)

	plan2 := &models.Plan{
		Name:        "Premium Plan",
		Description: "Premium features",
		Price:       19.99,
	}
	db.Create(plan2)

	// Create test user with a plan
	user := &models.User{
		Username:  "testuser",
		Email:     "test@example.com",
		FirstName: "Test",
		LastName:  "User",
		Address:   "123 Test St",
		City:      "Test City",
		State:     "Test State",
		Country:   "Test Country",
		ZipCode:   "12345",
		Phone:     "123-456-7890",
		PlanID:    plan1.ID,
		UserID:    1, // Set the user ID to match their own ID for self-referencing
	}
	db.Create(user)
	// After creating the user, update the UserID to match the user's own ID
	user.UserID = user.ID
	db.Save(user)

	// Create handler
	handler := &Handler{db: db}

	// Setup router
	router := gin.New()

	// Add middleware to set user ID in context for testing
	router.Use(func(c *gin.Context) {
		// Check for authentication header - only set UserID if present
		if c.GetHeader("Authorization") != "" {
			c.Set(UserIDKey, user.ID)
		}
		c.Next()
	})

	// Add user scope middleware only after auth check
	router.Use(func(c *gin.Context) {
		// Check if we have a user ID in the context
		if _, exists := c.Get(UserIDKey); exists {
			// Apply the user scope middleware
			UserScopeMiddleware(db)(c)
		}
	})

	return router, handler, user
}

func TestGetUserProfileHandler(t *testing.T) {
	db := setupTestDB(t)
	router, handler, user := setupTestUserProfile(t, db)

	// Register the handler with the router
	router.GET("/profile", handler.GetUserProfileHandler)

	tests := []struct {
		name       string
		setupAuth  func(*http.Request)
		wantStatus int
		wantBody   gin.H
	}{
		{
			name: "successful profile retrieval",
			setupAuth: func(req *http.Request) {
				token := GenerateTestToken(user.ID)
				req.Header.Set("Authorization", "Bearer "+token)
			},
			wantStatus: http.StatusOK,
			wantBody: gin.H{
				"user": map[string]interface{}{
					"id":         float64(user.ID),
					"username":   user.Username,
					"email":      user.Email,
					"first_name": user.FirstName,
					"last_name":  user.LastName,
				},
				"message": "success",
			},
		},
		{
			name: "unauthenticated request",
			setupAuth: func(req *http.Request) {
				// Don't set auth header
			},
			wantStatus: http.StatusUnauthorized,
			wantBody: gin.H{
				"message": "User not authenticated",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/profile", nil)
			if tt.setupAuth != nil {
				tt.setupAuth(req)
			}

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.wantStatus, w.Code)

			var got map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &got)
			assert.NoError(t, err)

			if message, exists := tt.wantBody["message"]; exists {
				assert.Equal(t, message, got["message"])
			}

			if tt.wantStatus == http.StatusOK {
				gotUser, ok := got["user"].(map[string]interface{})
				assert.True(t, ok)

				wantUser := tt.wantBody["user"].(map[string]interface{})
				for key, value := range wantUser {
					assert.Equal(t, value, gotUser[key], "user.%s mismatch", key)
				}
			}
		})
	}
}

func TestUpdateUserProfileHandler(t *testing.T) {
	db := setupTestDB(t)
	router, handler, user := setupTestUserProfile(t, db)

	// Register the handler with the router
	router.PUT("/profile", handler.UpdateUserProfileHandler)

	tests := []struct {
		name       string
		setupAuth  func(*http.Request)
		reqBody    models.UserProfileUpdate
		wantStatus int
		wantBody   gin.H
	}{
		{
			name: "successful profile update",
			setupAuth: func(req *http.Request) {
				token := GenerateTestToken(user.ID)
				req.Header.Set("Authorization", "Bearer "+token)
			},
			reqBody: models.UserProfileUpdate{
				FirstName: "Updated",
				LastName:  "Name",
				Address:   "123 Test St",
				City:      "Test City",
				State:     "Test State",
				Country:   "Test Country",
				ZipCode:   "12345",
				Phone:     "123-456-7890",
			},
			wantStatus: http.StatusOK,
			wantBody: gin.H{
				"message": "Profile updated successfully",
			},
		},
		{
			name: "unauthenticated request",
			setupAuth: func(req *http.Request) {
				// Don't set auth header
			},
			reqBody: models.UserProfileUpdate{
				FirstName: "Updated",
				LastName:  "Name",
			},
			wantStatus: http.StatusUnauthorized,
			wantBody: gin.H{
				"message": "User not authenticated",
			},
		},
		{
			name: "invalid request data",
			setupAuth: func(req *http.Request) {
				token := GenerateTestToken(user.ID)
				req.Header.Set("Authorization", "Bearer "+token)
			},
			reqBody:    models.UserProfileUpdate{}, // Empty request - should fail binding
			wantStatus: http.StatusBadRequest,
			wantBody: gin.H{
				"message": "Invalid request data",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jsonData, err := json.Marshal(tt.reqBody)
			assert.NoError(t, err)

			req, _ := http.NewRequest("PUT", "/profile", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			if tt.setupAuth != nil {
				tt.setupAuth(req)
			}

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.wantStatus, w.Code)

			var got map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &got)
			assert.NoError(t, err)

			if message, exists := tt.wantBody["message"]; exists {
				assert.Equal(t, message, got["message"])
			}

			// If successful update, verify the user data was updated in the database
			if tt.wantStatus == http.StatusOK {
				var updatedUser models.User
				err := db.First(&updatedUser, user.ID).Error
				assert.NoError(t, err)

				assert.Equal(t, tt.reqBody.FirstName, updatedUser.FirstName)
				assert.Equal(t, tt.reqBody.LastName, updatedUser.LastName)
				assert.Equal(t, tt.reqBody.Address, updatedUser.Address)
				assert.Equal(t, tt.reqBody.City, updatedUser.City)
				assert.Equal(t, tt.reqBody.State, updatedUser.State)
				assert.Equal(t, tt.reqBody.Country, updatedUser.Country)
				assert.Equal(t, tt.reqBody.ZipCode, updatedUser.ZipCode)
				assert.Equal(t, tt.reqBody.Phone, updatedUser.Phone)
			}
		})
	}
}

func TestUpdateUserPlanHandler(t *testing.T) {
	db := setupTestDB(t)
	router, handler, user := setupTestUserProfile(t, db)

	// Register the handler with the router
	router.PUT("/plan", handler.UpdateUserPlanHandler)

	tests := []struct {
		name       string
		setupAuth  func(*http.Request)
		planID     uint
		wantStatus int
		wantBody   gin.H
	}{
		{
			name: "successful plan update",
			setupAuth: func(req *http.Request) {
				token := GenerateTestToken(user.ID)
				req.Header.Set("Authorization", "Bearer "+token)
			},
			planID:     2,
			wantStatus: http.StatusOK,
			wantBody: gin.H{
				"message": "Plan updated successfully",
			},
		},
		{
			name: "invalid plan ID",
			setupAuth: func(req *http.Request) {
				token := GenerateTestToken(user.ID)
				req.Header.Set("Authorization", "Bearer "+token)
			},
			planID:     999, // Non-existent plan ID
			wantStatus: http.StatusNotFound,
			wantBody: gin.H{
				"message": "Plan not found",
			},
		},
		{
			name: "unauthenticated request",
			setupAuth: func(req *http.Request) {
				// Don't set auth header
			},
			planID:     2,
			wantStatus: http.StatusUnauthorized,
			wantBody: gin.H{
				"message": "User not authenticated",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jsonData, err := json.Marshal(models.UserPlanUpdate{PlanID: tt.planID})
			assert.NoError(t, err)

			req, _ := http.NewRequest("PUT", "/plan", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			if tt.setupAuth != nil {
				tt.setupAuth(req)
			}

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.wantStatus, w.Code)

			var got map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &got)
			assert.NoError(t, err)

			if message, exists := tt.wantBody["message"]; exists {
				assert.Equal(t, message, got["message"])
			}

			// If successful update, verify the user's plan was updated in the database
			if tt.wantStatus == http.StatusOK {
				var updatedUser models.User
				err := db.First(&updatedUser, user.ID).Error
				assert.NoError(t, err)
				assert.Equal(t, tt.planID, updatedUser.PlanID)
			}
		})
	}
}

func TestGetAvailablePlansHandler(t *testing.T) {
	db := setupTestDB(t)
	router, handler, _ := setupTestUserProfile(t, db)

	// Register the handler with the router
	router.GET("/plans", handler.GetAvailablePlansHandler)

	// Create a request
	req, _ := http.NewRequest("GET", "/plans", nil)
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Check the response
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Verify the response structure
	assert.Equal(t, "success", response["message"])

	plans, ok := response["plans"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, plans, 2) // We created 2 plans in setupTestUserProfile

	// Verify the first plan
	plan1 := plans[0].(map[string]interface{})
	assert.Equal(t, "Basic Plan", plan1["name"])
	assert.Equal(t, "Basic features", plan1["description"])
	assert.Equal(t, 9.99, plan1["price"])

	// Verify the second plan
	plan2 := plans[1].(map[string]interface{})
	assert.Equal(t, "Premium Plan", plan2["name"])
	assert.Equal(t, "Premium features", plan2["description"])
	assert.Equal(t, 19.99, plan2["price"])
}
