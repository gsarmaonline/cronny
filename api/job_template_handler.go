package api

import (
	"github.com/cronny/models"
	"github.com/gin-gonic/gin"
)

func (handler *Handler) JobTemplateIndexHandler(c *gin.Context) {
	var (
		jobTemplates []*models.JobTemplate
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
func (handler *Handler) jobTemplateCreateHandler(c *gin.Context) {
	var (
		jobTemplate *models.JobTemplate
		err         error
	)
	jobTemplate = &models.JobTemplate{}
	if err = c.ShouldBindJSON(jobTemplate); err != nil {
		c.JSON(400, gin.H{
			"message": err.Error(),
		})
		return
	}
	if ex := handler.db.Save(jobTemplate); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"jobTemplate": jobTemplate,
		"message":     "success",
	})
	return
}
