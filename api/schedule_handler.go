package api

import (
	"strconv"

	"github.com/cronny/service"
	"github.com/gin-gonic/gin"
)

func (handler *Handler) ScheduleIndexHandler(c *gin.Context) {
	var (
		schedules []*service.Schedule
	)
	if ex := handler.db.Preload("Action").Find(&schedules); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"schedules": schedules,
		"message":   "success",
	})
	return
}

func (handler *Handler) ScheduleCreateHandler(c *gin.Context) {
	var (
		schedule *service.Schedule
		err      error
	)
	schedule = &service.Schedule{}
	if err = c.ShouldBindJSON(schedule); err != nil {
		c.JSON(400, gin.H{
			"message": err.Error(),
		})
		return
	}
	if ex := handler.db.Save(schedule); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"schedule": schedule,
		"message":  "success",
	})
	return
}

func (handler *Handler) ScheduleUpdateHandler(c *gin.Context) {
	var (
		schedule        *service.Schedule
		updatedSchedule *service.Schedule
		scheduleId      int
		err             error
	)
	schedule = &service.Schedule{}
	updatedSchedule = &service.Schedule{}

	if scheduleId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.db.Where("id = ?", uint(scheduleId)).First(schedule); ex.Error != nil {
		c.JSON(400, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	if err = c.ShouldBindJSON(updatedSchedule); err != nil {
		c.JSON(400, gin.H{
			"message": err.Error(),
		})
		return
	}
	if ex := handler.db.Model(schedule).Updates(updatedSchedule); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"schedule": schedule,
		"message":  "success",
	})
	return
}

func (handler *Handler) ScheduleDeleteHandler(c *gin.Context) {
	var (
		schedule   *service.Schedule
		scheduleId int
		err        error
	)
	if scheduleId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.db.Delete(&service.Schedule{}, scheduleId); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"schedule": schedule,
		"message":  "success",
	})
	return
}
