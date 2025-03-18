package api

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// UserScopeMiddleware creates middleware that adds user scoping to database queries
// This middleware should be applied to routes that need user scoping
func UserScopeMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by AuthMiddleware)
		userID, exists := GetUserID(c)
		if !exists {
			c.JSON(401, gin.H{
				"message": "user ID not found",
			})
			c.Abort()
			return
		}

		// Create a user-scoped database instance
		scopedDB := db.Where("user_id = ?", userID)

		// Store the scoped DB in the context for handlers to use
		c.Set(ScopedDBKey, scopedDB)

		c.Next()
	}
}
