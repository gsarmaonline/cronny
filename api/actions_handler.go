package api

import (
	"github.com/cronny/service"
	"github.com/gin-gonic/gin"
)

func (handler *Handler) ActionIndexHandler(c *gin.Context) {
	var (
		actions []*service.Action
	)
	if ex := handler.db.Preload("Stages").Find(&actions); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"actions": actions,
		"message": "success",
	})
	return
}
