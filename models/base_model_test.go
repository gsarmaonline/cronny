package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// TestModel is a simple model that embeds BaseModel for testing
type TestModel struct {
	BaseModel
	Name string
}

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err, "Failed to open in-memory SQLite database")

	// Create the test table
	err = db.AutoMigrate(&TestModel{})
	assert.NoError(t, err, "Failed to create test table")

	return db
}

func TestBaseModel_SetUserID(t *testing.T) {
	model := &TestModel{}
	userID := uint(123)

	// Set user ID
	model.SetUserID(userID)

	// Verify
	assert.Equal(t, userID, model.UserID, "UserID should be set correctly")
	assert.Equal(t, userID, model.GetUserID(), "GetUserID should return the set user ID")
}

func TestBaseModel_HasUserID(t *testing.T) {
	// Test with no user ID
	model := &TestModel{}
	assert.False(t, model.HasUserID(), "HasUserID should return false when no user ID is set")

	// Test with user ID
	model.SetUserID(123)
	assert.True(t, model.HasUserID(), "HasUserID should return true when user ID is set")
}

func TestBaseModel_ValidateUserID(t *testing.T) {
	// Test with no user ID
	model := &TestModel{}
	err := model.ValidateUserID()
	assert.Error(t, err, "ValidateUserID should return error when no user ID is set")
	assert.Contains(t, err.Error(), "user ID is required", "Error message should indicate user ID is required")

	// Test with user ID
	model.SetUserID(123)
	err = model.ValidateUserID()
	assert.NoError(t, err, "ValidateUserID should not return error when user ID is set")
}

func TestBaseModel_BeforeSave(t *testing.T) {
	db := setupTestDB(t)

	// Test saving without user ID
	model := &TestModel{
		Name: "Test Model",
	}
	err := db.Create(model).Error
	assert.Error(t, err, "Saving without user ID should fail")

	// Test saving with user ID
	model = &TestModel{
		Name: "Test Model",
	}
	model.SetUserID(123)
	err = db.Create(model).Error
	assert.NoError(t, err, "Saving with user ID should succeed")

	// Verify the model was saved
	var savedModel TestModel
	err = db.First(&savedModel, model.ID).Error
	assert.NoError(t, err, "Should be able to retrieve the saved model")
	assert.Equal(t, uint(123), savedModel.UserID, "Saved model should have the correct user ID")
}
