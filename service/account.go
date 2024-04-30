package service

import (
	"gorm.io/gorm"
)

const (
	AdminUserType = UserTypeT("admin")
)

type (
	UserTypeT string

	Account struct {
		gorm.Model

		Name       string `json:"name"`
		AdminEmail string `json:"admin_email"`
	}

	User struct {
		gorm.Model

		Name  string `json:"name"`
		Email string `json:"email"`

		AccountID uint     `json:"account_id"`
		Account   *Account `json:"-"`

		UserType UserTypeT `json:"user_type"`
	}
)
