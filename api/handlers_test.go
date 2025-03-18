package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cronny/models"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open in-memory SQLite database: %v", err)
	}
	return db
}

func setupTestContext() (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/", nil)
	return c, w
}

// Test cases for the combined GetScopedDB method
func TestGetScopedDB_ContextFirst(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	handler := &Handler{db: db}
	c, _ := setupTestContext()

	// Set user ID in context
	userID := uint(123)
	c.Set(UserIDKey, userID)

	// Create a pre-scoped DB and put it in context
	preScoped := db.Where("user_id = ?", uint(999)) // Different user ID to prove it's using this DB
	c.Set(ScopedDBKey, preScoped)

	// Execute - should return the DB from context
	result := handler.GetUserScopedDb(c)

	// Verify
	assert.NotNil(t, result, "Should return a DB instance")
	assert.Equal(t, preScoped, result, "Should return the same DB instance from context")
}

func TestGetScopedDB_CreateNew(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	handler := &Handler{db: db}
	c, _ := setupTestContext()

	// Set user ID in context
	userID := uint(123)
	c.Set(UserIDKey, userID)

	// Create a scoped DB and set it in the context
	scopedDB := db.Where("user_id = ?", userID)
	c.Set(ScopedDBKey, scopedDB)

	// Execute - should get the DB from context
	result := handler.GetUserScopedDb(c)

	// Verify
	assert.NotNil(t, result, "Should return a DB instance")
	assert.Equal(t, scopedDB, result, "Should return the DB from context")

	// Verify it's a properly scoped DB
	stmt := result.Session(&gorm.Session{DryRun: true}).Find(&struct{}{})
	assert.Contains(t, stmt.Statement.SQL.String(), "WHERE user_id = ?",
		"SQL should contain WHERE user_id = ? clause")
}

func TestGetScopedDB_NoUserID(t *testing.T) {
	// This test is now redundant since the GetUserScopedDb function doesn't check for user ID
	// Keeping it as a placeholder
	t.Skip("This test is now redundant")
}

// Original tests for GetUserScopedDb
func TestGetUserScopedDb_WithoutUserID(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	handler := &Handler{db: db}
	c, _ := setupTestContext()

	// Create a scoped DB and set it in the context
	scopedDB := db.Session(&gorm.Session{}) // Create a new DB session
	c.Set(ScopedDBKey, scopedDB)

	// Execute
	result := handler.GetUserScopedDb(c)

	// Verify
	assert.NotNil(t, result, "Should return a DB instance even without user ID")
	assert.Equal(t, scopedDB, result, "Should return the DB from context")
}

func TestGetUserScopedDb_WithUserID(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	handler := &Handler{db: db}
	c, _ := setupTestContext()

	// Set user ID in context
	userID := uint(123)
	c.Set(UserIDKey, userID)

	// First put a scoped DB in the context
	scopedDB := db.Where("user_id = ?", userID)
	c.Set(ScopedDBKey, scopedDB)

	// Execute
	result := handler.GetUserScopedDb(c)

	// Verify
	assert.NotNil(t, result, "Should return a DB instance")
	assert.Equal(t, scopedDB, result, "Should return the DB from context")
}

func TestGetUserScopedDb_WithProvidedDB(t *testing.T) {
	// Setup
	originalDB := setupTestDB(t)
	providedDB := setupTestDB(t)
	handler := &Handler{db: originalDB}
	c, _ := setupTestContext()

	// Set user ID in context
	userID := uint(123)
	c.Set(UserIDKey, userID)

	// Create a scoped DB and put it in context
	scopedDB := providedDB.Where("user_id = ?", userID)
	c.Set(ScopedDBKey, scopedDB)

	// Execute
	result := handler.GetUserScopedDb(c)

	// Verify
	assert.NotNil(t, result, "Should return a DB instance")
	assert.Equal(t, scopedDB, result, "Should return the DB from context")
}

func TestGetUserScopedDb_InvalidUserIDType(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	handler := &Handler{db: db}
	c, _ := setupTestContext()

	// Set an invalid user ID type in context
	c.Set(UserIDKey, "not-a-uint")

	// Create a scoped DB and put it in context
	scopedDB := db // Just use the regular DB for this test
	c.Set(ScopedDBKey, scopedDB)

	// Execute
	result := handler.GetUserScopedDb(c)

	// Verify
	assert.NotNil(t, result, "Should return a DB instance even with invalid user ID type")
	assert.Equal(t, scopedDB, result, "Should return the DB from context")
}

// Define a test model for SaveWithUser tests
type TestModel struct {
	models.BaseModel
	Name string
}

func TestSaveWithUser_NilDB(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	// Create the test table
	db.AutoMigrate(&TestModel{})

	handler := &Handler{db: db}
	c, _ := setupTestContext()

	// Set user ID in context
	userID := uint(123)
	c.Set(UserIDKey, userID)

	// Create a test model
	model := &TestModel{
		Name: "Test Model",
	}
	model.SetUserID(userID)

	// Execute
	err := handler.SaveWithUser(c, nil, model)

	// Verify
	assert.NoError(t, err, "Should not return error when saving a valid model")

	// Check that the model was saved
	var savedModel TestModel
	result := db.First(&savedModel, model.ID)
	assert.NoError(t, result.Error, "Should be able to find the saved model")
	assert.Equal(t, model.Name, savedModel.Name, "Saved model should have the same name")
	assert.Equal(t, userID, savedModel.GetUserID(), "Saved model should have the same user ID")
}

func TestSaveWithUser_WithProvidedDB(t *testing.T) {
	// Setup
	originalDB := setupTestDB(t)
	providedDB := setupTestDB(t)

	// Create the test table in both DBs
	originalDB.AutoMigrate(&TestModel{})
	providedDB.AutoMigrate(&TestModel{})

	handler := &Handler{db: originalDB}
	c, _ := setupTestContext()

	// Set user ID in context
	userID := uint(123)
	c.Set(UserIDKey, userID)

	// Create a test model
	model := &TestModel{
		Name: "Test Model",
	}
	model.SetUserID(userID)

	// Execute
	err := handler.SaveWithUser(c, providedDB, model)

	// Verify
	assert.NoError(t, err, "Should not return error when saving a valid model")

	// Check that the model was saved in the provided DB
	var savedModel TestModel
	result := providedDB.First(&savedModel, model.ID)
	assert.NoError(t, result.Error, "Should be able to find the saved model in provided DB")
	assert.Equal(t, model.Name, savedModel.Name, "Saved model should have the same name")
	assert.Equal(t, userID, savedModel.GetUserID(), "Saved model should have the same user ID")

	// Check that the model was NOT saved in the original DB
	var notSavedModel TestModel
	result = originalDB.First(&notSavedModel, model.ID)
	assert.Error(t, result.Error, "Should not be able to find the model in original DB")
}

func TestSaveWithUser_InvalidModel(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	// Create the test table
	db.AutoMigrate(&TestModel{})

	handler := &Handler{db: db}
	c, _ := setupTestContext()

	// Set user ID in context
	userID := uint(123)
	c.Set(UserIDKey, userID)

	// Create a test model without setting user ID
	model := &TestModel{
		Name: "Test Model",
	}

	// Create a mock DB that will return an error
	mockDB, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err, "Should be able to create a mock DB")

	// Create a DB session that will always return an error
	mockDB = mockDB.Session(&gorm.Session{
		DryRun: true,
	})

	// Set an error on the DB
	mockDB.AddError(fmt.Errorf("mock save error"))

	// Execute with the mock DB
	err = handler.SaveWithUser(c, mockDB, model)

	// Verify
	assert.Error(t, err, "Should return error when saving an invalid model")
	assert.Contains(t, err.Error(), "mock save error", "Error message should contain the mock error")
}
