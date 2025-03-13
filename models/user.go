package models

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model

	Username  string `json:"username" gorm:"type:varchar(100);uniqueIndex"`
	Email     string `json:"email" gorm:"type:varchar(100);uniqueIndex"`
	Password  string `json:"-" gorm:"type:varchar(255)"` // Password is never returned in JSON
	GoogleID  string `json:"-" gorm:"type:varchar(255);uniqueIndex"` // Google ID for OAuth
	AvatarURL string `json:"avatar_url" gorm:"type:varchar(255)"` // Profile picture URL
}

// HashPassword hashes the user's password
func (u *User) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// CheckPassword verifies the password against the hash
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// UserLogin represents the login request
type UserLogin struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// UserRegistration represents a registration request
type UserRegistration struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}
