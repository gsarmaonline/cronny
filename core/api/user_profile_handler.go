package api

import (
	"github.com/cronny/core/models"
	"github.com/gin-gonic/gin"
)

// UserProfileResponse represents the response for user profile endpoints
type UserProfileResponse struct {
	User    models.User `json:"user"`
	Message string      `json:"message"`
}

// PlansResponse represents the response for plans endpoints
type PlansResponse struct {
	Plans   []models.Plan `json:"plans"`
	Message string        `json:"message"`
}

// GetUserProfileHandler returns the current user's profile
func (handler *Handler) GetUserProfileHandler(c *gin.Context) {
	userID, exists := GetUserID(c)
	if !exists {
		c.JSON(401, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	var user models.User
	if err := handler.GetUserScopedDb(c).Preload("Plan").First(&user, userID).Error; err != nil {
		c.JSON(404, gin.H{
			"message": "User not found",
		})
		return
	}

	c.JSON(200, gin.H{
		"user":    user,
		"message": "success",
	})
}

// UpdateUserProfileHandler updates the current user's profile
func (handler *Handler) UpdateUserProfileHandler(c *gin.Context) {
	userID, exists := GetUserID(c)
	if !exists {
		c.JSON(401, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	var update models.UserProfileUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(400, gin.H{
			"message": "Invalid request data",
		})
		return
	}

	// Validate that at least one field is provided
	if update.FirstName == "" && update.LastName == "" && update.Address == "" &&
		update.City == "" && update.State == "" && update.Country == "" &&
		update.ZipCode == "" && update.Phone == "" {
		c.JSON(400, gin.H{
			"message": "Invalid request data",
		})
		return
	}

	var user models.User
	if err := handler.GetUserScopedDb(c).First(&user, userID).Error; err != nil {
		c.JSON(404, gin.H{
			"message": "User not found",
		})
		return
	}

	// Update user fields
	user.FirstName = update.FirstName
	user.LastName = update.LastName
	user.Address = update.Address
	user.City = update.City
	user.State = update.State
	user.Country = update.Country
	user.ZipCode = update.ZipCode
	user.Phone = update.Phone

	if err := handler.SaveWithUser(c, &user); err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to update profile",
		})
		return
	}

	// Reload user with plan data
	if err := handler.GetUserScopedDb(c).Preload("Plan").First(&user, user.ID).Error; err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to reload user data",
		})
		return
	}

	c.JSON(200, gin.H{
		"user":    user,
		"message": "Profile updated successfully",
	})
}

// UpdateUserPlanHandler updates the current user's plan
func (handler *Handler) UpdateUserPlanHandler(c *gin.Context) {
	userID, exists := GetUserID(c)
	if !exists {
		c.JSON(401, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	var update models.UserPlanUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(400, gin.H{
			"message": "Invalid request data",
		})
		return
	}

	var user models.User
	if err := handler.GetUserScopedDb(c).First(&user, userID).Error; err != nil {
		c.JSON(404, gin.H{
			"message": "User not found",
		})
		return
	}

	// Check if the plan exists
	var plan models.Plan
	if err := handler.db.First(&plan, update.PlanID).Error; err != nil {
		c.JSON(404, gin.H{
			"message": "Plan not found",
		})
		return
	}

	// Update user's plan
	user.PlanID = update.PlanID

	if err := handler.SaveWithUser(c, &user); err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to update plan",
		})
		return
	}

	// Reload user with plan and features data
	if err := handler.GetUserScopedDb(c).Preload("Plan").Preload("Plan.Features").First(&user, user.ID).Error; err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to reload user data",
		})
		return
	}

	c.JSON(200, gin.H{
		"user":    user,
		"message": "Plan updated successfully",
	})
}

// GetAvailablePlansHandler returns all available plans
func (handler *Handler) GetAvailablePlansHandler(c *gin.Context) {
	var plans []models.Plan
	if err := handler.db.Preload("Features").Find(&plans).Error; err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to fetch plans",
		})
		return
	}

	c.JSON(200, gin.H{
		"plans":   plans,
		"message": "success",
	})
}
