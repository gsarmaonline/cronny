package api

import (
	"github.com/cronny/models"
	"github.com/gin-gonic/gin"
)

func (handler *Handler) JobTemplateIndexHandler(c *gin.Context) {
	jobTemplates := []models.JobTemplate{}
	handler.GetUserScopedDb(c).Find(&jobTemplates)

	c.JSON(200, gin.H{
		"job_templates": jobTemplates,
	})
}
