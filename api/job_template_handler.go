package api

import (
	"github.com/cronny/service"
	"github.com/gin-gonic/gin"
)

func (handler *Handler) JobTemplateIndexHandler(c *gin.Context) {
	var (
		jobTemplates []*service.JobTemplate
	)
	if ex := handler.db.Find(&jobTemplates); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"job_templates": jobTemplates,
		"message":       "success",
	})
	return
}
