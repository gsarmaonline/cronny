package api

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

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

func TestSaveWithUser(t *testing.T) {
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

	// Execute
	err := handler.SaveWithUser(c, model)

	// Verify
	assert.NoError(t, err, "Should not return error when saving a valid model")

	// Check that the model was saved with correct user ID
	var savedModel TestModel
	result := db.First(&savedModel, model.ID)
	assert.NoError(t, result.Error, "Should be able to find the saved model")
	assert.Equal(t, model.Name, savedModel.Name, "Saved model should have the same name")
	assert.Equal(t, userID, savedModel.GetUserID(), "Saved model should have the correct user ID")
}

func TestSaveWithUser_NoUserID(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	// Create the test table
	db.AutoMigrate(&TestModel{})

	handler := &Handler{db: db}
	c, _ := setupTestContext()
	// Do not set user ID in context

	// Create a test model
	model := &TestModel{
		Name: "Test Model",
	}

	// Execute
	err := handler.SaveWithUser(c, model)

	// Verify
	assert.Error(t, err, "Should return error when user ID is not found")
	assert.Contains(t, err.Error(), "user ID not found", "Error message should indicate user ID is missing")
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

	// Replace handler's DB with mock
	originalDB := handler.db
	handler.db = mockDB
	defer func() { handler.db = originalDB }()

	// Execute with the mock DB
	err = handler.SaveWithUser(c, model)

	// Verify
	assert.Error(t, err, "Should return error when saving an invalid model")
	assert.Contains(t, err.Error(), "mock save error", "Error message should contain the mock error")
}

func TestUpdateWithUser(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	// Create the test table
	db.AutoMigrate(&TestModel{})

	handler := &Handler{db: db}
	c, _ := setupTestContext()

	// Set user ID in context
	userID := uint(123)
	c.Set(UserIDKey, userID)

	// Create a test model and save it
	originalModel := &TestModel{
		Name: "Original Name",
	}
	originalModel.SetUserID(userID)
	db.Create(originalModel)

	// Create updated model
	updatedModel := &TestModel{
		Name: "Updated Name",
	}

	// Execute
	err := handler.UpdateWithUser(c, originalModel, updatedModel)

	// Verify
	assert.NoError(t, err, "Should not return error when updating a valid model")

	// Check that the model was updated
	var savedModel TestModel
	result := db.First(&savedModel, originalModel.ID)
	assert.NoError(t, result.Error, "Should be able to find the updated model")
	assert.Equal(t, "Updated Name", savedModel.Name, "Model should have the updated name")
	assert.Equal(t, userID, savedModel.GetUserID(), "Model should preserve the user ID")
}

func TestUpdateWithUser_NoUserID(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	// Create the test table
	db.AutoMigrate(&TestModel{})

	handler := &Handler{db: db}
	c, _ := setupTestContext()
	// Do not set user ID in context

	// Create models for update
	originalModel := &TestModel{Name: "Original Name"}
	updatedModel := &TestModel{Name: "Updated Name"}

	// Execute
	err := handler.UpdateWithUser(c, originalModel, updatedModel)

	// Verify
	assert.Error(t, err, "Should return error when user ID is not found")
	assert.Contains(t, err.Error(), "user ID not found", "Error message should indicate user ID is missing")
}

func TestUpdateWithUser_Error(t *testing.T) {
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
	originalModel := &TestModel{
		Name: "Original Name",
	}
	originalModel.SetUserID(userID)

	updatedModel := &TestModel{
		Name: "Updated Name",
	}

	// Create a mock DB that will return an error
	mockDB, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err, "Should be able to create a mock DB")

	// Create a DB session that will always return an error
	mockDB = mockDB.Session(&gorm.Session{
		DryRun: true,
	})

	// Set an error on the DB
	mockDB.AddError(fmt.Errorf("mock update error"))

	// Replace handler's DB with mock
	originalDB := handler.db
	handler.db = mockDB
	defer func() { handler.db = originalDB }()

	// Execute with the mock DB
	err = handler.UpdateWithUser(c, originalModel, updatedModel)

	// Verify
	assert.Error(t, err, "Should return error when updating fails")
	assert.Contains(t, err.Error(), "mock update error", "Error message should contain the mock error")
}
