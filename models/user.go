package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"type:varchar(100);uniqueIndex"`
	Email     string    `json:"email" gorm:"type:varchar(100);uniqueIndex"`
	Password  string    `json:"-" gorm:"type:varchar(255)"`             // Password is never returned in JSON
	GoogleID  string    `json:"-" gorm:"type:varchar(255);uniqueIndex"` // Google ID for OAuth
	AvatarURL string    `json:"avatar_url" gorm:"type:varchar(255)"`    // Profile picture URL
	FirstName string    `json:"first_name" gorm:"type:varchar(100)"`
	LastName  string    `json:"last_name" gorm:"type:varchar(100)"`
	Address   string    `json:"address" gorm:"type:text"`
	City      string    `json:"city" gorm:"type:varchar(100)"`
	State     string    `json:"state" gorm:"type:varchar(100)"`
	Country   string    `json:"country" gorm:"type:varchar(100)"`
	ZipCode   string    `json:"zip_code" gorm:"type:varchar(20)"`
	Phone     string    `json:"phone" gorm:"type:varchar(20)"`
	PlanID    uint      `json:"plan_id" gorm:"default:1"` // Default to Starter plan
	Plan      Plan      `json:"plan" gorm:"foreignKey:PlanID"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
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

// GetDefaultPlan returns the default starter plan for new users
func GetDefaultPlan() Plan {
	return Plan{
		Name:        "Starter",
		Type:        PlanTypeStarter,
		Price:       0,
		Description: "Perfect for small projects",
		Features: []Feature{
			{Name: "Up to 10 jobs", Description: "Create and manage up to 10 jobs"},
			{Name: "Basic scheduling", Description: "Basic scheduling capabilities"},
			{Name: "Email notifications", Description: "Email notifications for job status"},
			{Name: "Community support", Description: "Community-based support"},
		},
	}
}

// UserProfileUpdate represents a profile update request
type UserProfileUpdate struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Address   string `json:"address"`
	City      string `json:"city"`
	State     string `json:"state"`
	Country   string `json:"country"`
	ZipCode   string `json:"zip_code"`
	Phone     string `json:"phone"`
}

// UserPlanUpdate represents a plan update request
type UserPlanUpdate struct {
	PlanID uint `json:"plan_id" binding:"required"`
}
