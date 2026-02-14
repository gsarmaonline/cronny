package models

import (
	"errors"

	"gorm.io/gorm"
)

// BaseModel extends gorm.Model with user-related functionality
type BaseModel struct {
	gorm.Model
	UserID uint `json:"user_id" gorm:"index"`
}

// SetUserID sets the user ID for the model
func (m *BaseModel) SetUserID(userID uint) {
	m.UserID = userID
}

// GetUserID returns the user ID associated with the model
func (m *BaseModel) GetUserID() uint {
	return m.UserID
}

// HasUserID checks if the model has a user ID set
func (m *BaseModel) HasUserID() bool {
	return m.UserID > 0
}

// ValidateUserID validates that the model has a valid user ID
func (m *BaseModel) ValidateUserID() error {
	if !m.HasUserID() {
		return errors.New("user ID is required")
	}
	return nil
}

// UserOwned interface defines methods that user-owned models should implement
type UserOwned interface {
	SetUserID(userID uint)
	GetUserID() uint
	HasUserID() bool
	ValidateUserID() error
}

// BeforeSave hook to ensure user ID is set before saving
func (m *BaseModel) BeforeSave(tx *gorm.DB) error {
	return m.ValidateUserID()
}
