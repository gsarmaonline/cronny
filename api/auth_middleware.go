package api

import (
	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		c.Set("example", "12345")

		c.Next()
	}
}
