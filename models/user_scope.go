package models

import (
	"gorm.io/gorm"
)

// UserScope is a GORM middleware that automatically scopes queries to the current user
func UserScope(userID uint) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("user_id = ?", userID)
	}
}

// SetUserID is a GORM hook that sets the user_id field before creating a record
func SetUserID(userID uint) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if db.Statement.Schema != nil {
			if _, ok := db.Statement.Schema.FieldsByName["UserID"]; ok {
				db.Statement.SetColumn("user_id", userID)
			}
		}
		return db
	}
}
