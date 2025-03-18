package api

import (
	"strconv"

	"github.com/cronny/models"
	"github.com/gin-gonic/gin"
)

func (handler *Handler) JobIndexHandler(c *gin.Context) {
	var (
		jobs []*models.Job
	)

	// Check if action_id query param exists
	actionIDStr := c.Query("action_id")

	actionID, err := strconv.Atoi(actionIDStr)
	if err != nil || actionID == 0 {
		c.JSON(400, gin.H{
			"message": "Invalid action_id format",
		})
		return
	}

	if ex := handler.GetUserScopedDb(c).Preload("JobExecutions").Where("action_id = ?", actionID).Find(&jobs); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"jobs":    jobs,
		"message": "success",
	})
	return
}

func (handler *Handler) JobShowHandler(c *gin.Context) {
	var (
		job   *models.Job
		jobId int
		err   error
	)
	if jobId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.GetUserScopedDb(c).Preload("JobExecutions").Where("id = ?", jobId).First(&job); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"job":     job,
		"message": "success",
	})
	return
}

func (handler *Handler) JobCreateHandler(c *gin.Context) {
	var (
		job *models.Job
		err error
	)
	job = &models.Job{}
	if err = c.ShouldBindJSON(job); err != nil {
		c.JSON(400, gin.H{
			"message": err.Error(),
		})
		return
	}

	if err = handler.SaveWithUser(c, job); err != nil {
		c.JSON(500, gin.H{
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"job":     job,
		"message": "success",
	})
	return
}

func (handler *Handler) JobUpdateHandler(c *gin.Context) {
	var (
		job        *models.Job
		updatedJob *models.Job
		jobId      int
		err        error
	)
	job = &models.Job{}
	updatedJob = &models.Job{}

	if jobId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}

	if ex := handler.GetUserScopedDb(c).Where("id = ?", uint(jobId)).First(job); ex.Error != nil {
		c.JSON(400, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}

	if err = c.ShouldBindJSON(updatedJob); err != nil {
		c.JSON(400, gin.H{
			"message": err.Error(),
		})
		return
	}

	if err = handler.UpdateWithUser(c, job, updatedJob); err != nil {
		c.JSON(500, gin.H{
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"job":     job,
		"message": "success",
	})
	return
}

func (handler *Handler) JobDeleteHandler(c *gin.Context) {
	var (
		job   *models.Job
		jobId int
		err   error
	)
	if jobId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}

	// First find the job to ensure it belongs to the user
	job = &models.Job{}
	if ex := handler.GetUserScopedDb(c).Where("id = ?", uint(jobId)).First(job); ex.Error != nil {
		c.JSON(404, gin.H{
			"message": "Job not found",
		})
		return
	}

	// Then delete it using the handler's DB to avoid any ambiguity
	if ex := handler.db.Delete(job); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"job":     job,
		"message": "success",
	})
	return
}
