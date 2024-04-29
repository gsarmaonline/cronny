package organy

import (
	"gorm.io/gorm"
)

const (
	// Pricing Types
	PerUserPricingType  = PricingTypeT("per_user")
	PerEventPricingType = PricingTypeT("per_event")
	FlatRatePricingType = PricingTypeT("flat_rate")

	// Group Type
	StaticAssignmentGroupType  = GroupTypeT("static_assignment")
	DynamicAssignmentGroupType = GroupTypeT("dynamic_assignment")
)

type (
	EmployeeCountT uint8
	PricingTypeT   string
	GroupTypeT     string

	Plan struct {
		gorm.Model

		Name     string         `json:"name"`
		Features []*PlanFeature `json:"features"`
	}

	PlanFeature struct {
		gorm.Model

		Name string `json:"name"`

		PricingType PricingTypeT `json:"pricing_type"`
		PriceValue  float64      `json:"price_value"`
	}

	Account struct {
		gorm.Model

		Name           string `json:"string"`
		AdminUserEmail string `json:"admin_user_email"`

		EmployeeCountType EmployeeCountT `json:"employee_count_type"`

		AccountUsers []*AccountUser `json:"-"`
		Projects     []*Project     `json:"-"`
		Roles        []*Role        `json:"-"`
	}

	Group struct {
		gorm.Model

		Name      string     `json:"group"`
		GroupType GroupTypeT `json:"group_type"`

		Account   *Account `json:"-"`
		AccountID uint     `json:"account_id"`
	}

	GroupMembers struct {
		gorm.Model

		MemberType string `json:"member_type"`
		MemberID   uint   `json:"member_id"`
	}

	AccountUser struct {
		gorm.Model

		Name string `json:"name"`

		Email  string `json:"email"`
		Mobile string `json:"mobile"`

		Account   *Account `json:"-"`
		AccountID uint     `json:"account_id"`
	}

	Role struct {
		gorm.Model

		Name string `json:"name"`

		RoleUserType string `json:"role_user_type"`
		RoleUserID   uint   `json:"role_user_id"`

		RoleObjectType string `json:"role_object_type"`
		RoleObjectID   uint   `json:"role_object_id"`

		RoleActionType string `json:"role_action_type"`
		RoleActionID   uint   `json:"role_action_id"`

		Allow bool `json:"allow"`

		Account   *Account `json:"-"`
		AccountID uint     `json:"account_id"`
	}

	Project struct {
		gorm.Model

		Name string `json:"name"`
		Plan *Plan  `json:"plan"`

		Account   *Account `json:"-"`
		AccountID uint     `json:"account_id"`
	}
)
