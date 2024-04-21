package api

import (
	"strconv"

	"github.com/cronny/service"
	"github.com/gin-gonic/gin"
)

func (handler *Handler) JobShowHandler(c *gin.Context) {
	var (
		job   *service.Job
		jobId int
		err   error
	)
	if jobId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.db.Preload("JobExecutions").Where("id = ?", jobId).First(&job); ex.Error != nil {
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
		job *service.Job
		err error
	)
	job = &service.Job{}
	if err = c.ShouldBindJSON(job); err != nil {
		c.JSON(400, gin.H{
			"message": err.Error(),
		})
		return
	}
	if ex := handler.db.Save(job); ex.Error != nil {
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

func (handler *Handler) JobUpdateHandler(c *gin.Context) {
	var (
		job        *service.Job
		updatedJob *service.Job
		jobId      int
		err        error
	)
	job = &service.Job{}
	updatedJob = &service.Job{}

	if jobId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.db.Where("id = ?", uint(jobId)).First(job); ex.Error != nil {
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
	if ex := handler.db.Model(job).Updates(updatedJob); ex.Error != nil {
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

func (handler *Handler) JobDeleteHandler(c *gin.Context) {
	var (
		job   *service.Job
		jobId int
		err   error
	)
	if jobId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.db.Delete(&service.Job{}, jobId); ex.Error != nil {
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
