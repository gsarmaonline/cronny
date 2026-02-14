package api

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"

	"github.com/cronny/core/config"
)

func TestGetUserID_Success(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(nil)

	// Set a valid user ID in the context
	expectedUserID := uint(123)
	c.Set(UserIDKey, expectedUserID)

	// Execute
	userID, exists := GetUserID(c)

	// Verify
	assert.True(t, exists, "Should return true when user ID exists in context")
	assert.Equal(t, expectedUserID, userID, "Should return the correct user ID")
}

func TestGetUserID_NotExists(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(nil)

	// Don't set a user ID in the context

	// Execute
	userID, exists := GetUserID(c)

	// Verify
	assert.False(t, exists, "Should return false when user ID doesn't exist in context")
	assert.Equal(t, uint(0), userID, "Should return 0 when user ID doesn't exist")
}

func TestGetUserID_InvalidType(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(nil)

	// Set an invalid user ID type in the context
	c.Set(UserIDKey, "not-a-uint")

	// Execute
	userID, exists := GetUserID(c)

	// Verify
	assert.False(t, exists, "Should return false when user ID is of invalid type")
	assert.Equal(t, uint(0), userID, "Should return 0 when user ID is of invalid type")
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	_, r := gin.CreateTestContext(w)

	// Create a test route with the middleware
	r.Use(AuthMiddleware())
	r.GET("/test", func(c *gin.Context) {
		userID, exists := GetUserID(c)
		assert.True(t, exists, "User ID should exist in context")
		assert.Equal(t, uint(123), userID, "User ID should be set correctly")
		c.Status(http.StatusOK)
	})

	// Create a request with a valid token
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+GenerateTestToken(123))

	// Execute
	r.ServeHTTP(w, req)

	// Verify
	assert.Equal(t, http.StatusOK, w.Code, "Should return 200 OK for valid token")
}

func TestAuthMiddleware_MissingAuthHeader(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	_, r := gin.CreateTestContext(w)

	// Create a test route with the middleware
	r.Use(AuthMiddleware())
	r.GET("/test", func(c *gin.Context) {
		t.Fatal("This handler should not be called")
	})

	// Create a request without an Authorization header
	req, _ := http.NewRequest("GET", "/test", nil)

	// Execute
	r.ServeHTTP(w, req)

	// Verify
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized for missing header")
}

func TestAuthMiddleware_InvalidAuthHeader(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	_, r := gin.CreateTestContext(w)

	// Create a test route with the middleware
	r.Use(AuthMiddleware())
	r.GET("/test", func(c *gin.Context) {
		t.Fatal("This handler should not be called")
	})

	// Create a request with an invalid Authorization header format
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "InvalidFormat")

	// Execute
	r.ServeHTTP(w, req)

	// Verify
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized for invalid header format")
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	_, r := gin.CreateTestContext(w)

	// Create a test route with the middleware
	r.Use(AuthMiddleware())
	r.GET("/test", func(c *gin.Context) {
		t.Fatal("This handler should not be called")
	})

	// Create a request with an invalid token
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer invalidtoken")

	// Execute
	r.ServeHTTP(w, req)

	// Verify
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized for invalid token")
}

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	_, r := gin.CreateTestContext(w)

	// Create a test route with the middleware
	r.Use(AuthMiddleware())
	r.GET("/test", func(c *gin.Context) {
		t.Fatal("This handler should not be called")
	})

	// Create an expired token
	claims := jwt.MapClaims{
		"user_id": float64(123),
		"exp":     time.Now().Add(-time.Hour).Unix(), // Expired 1 hour ago
		"iat":     time.Now().Add(-time.Hour * 2).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(config.JWTSecret))

	// Create a request with the expired token
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)

	// Execute
	r.ServeHTTP(w, req)

	// Verify
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized for expired token")
}

func TestAuthMiddleware_InvalidUserIDClaim(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	_, r := gin.CreateTestContext(w)

	// Create a test route with the middleware
	r.Use(AuthMiddleware())
	r.GET("/test", func(c *gin.Context) {
		t.Fatal("This handler should not be called")
	})

	// Create a token with an invalid user_id claim
	claims := jwt.MapClaims{
		"user_id": "not-a-number", // Invalid type
		"exp":     time.Now().Add(time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(config.JWTSecret))

	// Create a request with the invalid token
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)

	// Execute
	r.ServeHTTP(w, req)

	// Verify
	assert.Equal(t, http.StatusUnauthorized, w.Code, "Should return 401 Unauthorized for invalid user_id claim")
}
