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

func TestGetUserScopedDb_WithoutUserID(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	handler := &Handler{db: db}
	c, _ := setupTestContext()

	// Execute
	scopedDB, err := handler.GetUserScopedDb(c, nil)

	// Verify
	assert.Error(t, err, "Should return error when no user ID is in context")
	assert.Nil(t, scopedDB, "Should return nil DB when no user ID is in context")
}

func TestGetUserScopedDb_WithUserID(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	handler := &Handler{db: db}
	c, _ := setupTestContext()

	// Set user ID in context
	userID := uint(123)
	c.Set(UserIDKey, userID)

	// Execute
	scopedDB, err := handler.GetUserScopedDb(c, nil)

	// Verify
	assert.NoError(t, err, "Should not return error when user ID is in context")
	assert.NotNil(t, scopedDB, "Should return a DB instance")

	// We can also check the statement by executing a dummy query and checking the SQL
	// This is a bit of a hack, but it works for testing purposes
	stmt := scopedDB.Session(&gorm.Session{DryRun: true}).Find(&struct{}{})
	assert.Contains(t, stmt.Statement.SQL.String(), "WHERE user_id = ?",
		"SQL should contain WHERE user_id = ? clause")
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

	// Execute
	scopedDB, err := handler.GetUserScopedDb(c, providedDB)

	// Verify
	assert.NoError(t, err, "Should not return error when user ID is in context")
	assert.NotNil(t, scopedDB, "Should return a DB instance")

	// The scoped DB should be based on the provided DB, not the handler's DB
	stmt := scopedDB.Session(&gorm.Session{DryRun: true}).Find(&struct{}{})
	assert.Contains(t, stmt.Statement.SQL.String(), "WHERE user_id = ?",
		"SQL should contain WHERE user_id = ? clause")

	// We can also verify it's not using the handler's DB by checking that a modification
	// to the scoped DB doesn't affect the handler's DB
	originalStmt := originalDB.Session(&gorm.Session{DryRun: true}).Find(&struct{}{})
	assert.NotContains(t, originalStmt.Statement.SQL.String(), "WHERE user_id = ?",
		"Original DB should not be modified")
}

func TestGetUserScopedDb_InvalidUserIDType(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	handler := &Handler{db: db}
	c, _ := setupTestContext()

	// Set an invalid user ID type in context
	c.Set(UserIDKey, "not-a-uint")

	// Execute
	scopedDB, err := handler.GetUserScopedDb(c, nil)

	// Verify
	assert.Error(t, err, "Should return error when user ID is of invalid type")
	assert.Nil(t, scopedDB, "Should return nil DB when user ID is of invalid type")
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
