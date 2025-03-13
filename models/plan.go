package models

import (
	"time"
)

type PlanType string

const (
	PlanTypeStarter    PlanType = "starter"
	PlanTypePro        PlanType = "pro"
	PlanTypeEnterprise PlanType = "enterprise"
)

type Plan struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Type        PlanType  `json:"type"`
	Price       float64   `json:"price"`
	Description string    `json:"description"`
	Features    []Feature `json:"features" gorm:"many2many:plan_features;"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Feature struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// PlanFeatures represents the many-to-many relationship between plans and features
type PlanFeatures struct {
	PlanID    uint `gorm:"primaryKey"`
	FeatureID uint `gorm:"primaryKey"`
}

// GetDefaultPlans returns the default plans with their features
func GetDefaultPlans() []Plan {
	return []Plan{
		{
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
		},
		{
			Name:        "Pro",
			Type:        PlanTypePro,
			Price:       29,
			Description: "For growing teams",
			Features: []Feature{
				{Name: "Unlimited jobs", Description: "Create and manage unlimited jobs"},
				{Name: "Advanced scheduling", Description: "Advanced scheduling capabilities"},
				{Name: "Slack notifications", Description: "Slack integration for notifications"},
				{Name: "Priority support", Description: "Priority customer support"},
				{Name: "Custom webhooks", Description: "Custom webhook integrations"},
				{Name: "API access", Description: "Full API access"},
			},
		},
		{
			Name:        "Enterprise",
			Type:        PlanTypeEnterprise,
			Price:       0, // Custom pricing
			Description: "For large organizations",
			Features: []Feature{
				{Name: "Everything in Pro", Description: "All Pro features included"},
				{Name: "Dedicated support", Description: "Dedicated customer support team"},
				{Name: "Custom integrations", Description: "Custom integration development"},
				{Name: "SLA guarantees", Description: "Service Level Agreement guarantees"},
				{Name: "Advanced security", Description: "Advanced security features"},
				{Name: "Team management", Description: "Team and user management"},
			},
		},
	}
}
