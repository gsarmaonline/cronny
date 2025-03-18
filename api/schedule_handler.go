package api

import (
	"log"
	"strconv"

	"github.com/cronny/models"
	"github.com/gin-gonic/gin"
)

func (handler *Handler) ScheduleIndexHandler(c *gin.Context) {
	var (
		schedules []*models.Schedule
	)

	if ex := handler.GetUserScopedDb(c).Preload("Action").Find(&schedules); ex.Error != nil {
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

func (handler *Handler) ScheduleShowHandler(c *gin.Context) {
	var (
		schedule   *models.Schedule
		scheduleId int
		err        error
	)

	if scheduleId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.GetUserScopedDb(c).Preload("Action").Where("id = ?", uint(scheduleId)).First(&schedule); ex.Error != nil {
		c.JSON(404, gin.H{
			"message": "Schedule not found",
		})
		return
	}
	c.JSON(200, gin.H{
		"schedule": schedule,
		"message":  "success",
	})
	return
}

func (handler *Handler) ScheduleCreateHandler(c *gin.Context) {
	var (
		schedule *models.Schedule
		err      error
	)
	schedule = &models.Schedule{}
	if err = c.ShouldBindJSON(schedule); err != nil {
		log.Println(schedule, err)
		c.JSON(400, gin.H{
			"message": err.Error(),
		})
		return
	}
	schedule.ScheduleExecType = models.AwsExecType
	schedule.ScheduleStatus = models.ScheduleStatusT(models.InactiveScheduleStatus)

	// Set the user ID from the context
	userID, exists := GetUserID(c)
	if !exists {
		c.JSON(401, gin.H{
			"message": "user ID not found",
		})
		return
	}
	schedule.SetUserID(userID)

	if ex := handler.GetUserScopedDb(c).Save(schedule); ex.Error != nil {
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
		schedule        *models.Schedule
		updatedSchedule *models.Schedule
		scheduleId      int
		err             error
	)

	// Get the user-scoped database from context

	schedule = &models.Schedule{}
	updatedSchedule = &models.Schedule{}
	schedule.ScheduleExecType = models.AwsExecType
	updatedSchedule.ScheduleExecType = models.AwsExecType

	if scheduleId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.GetUserScopedDb(c).Where("id = ?", uint(scheduleId)).First(schedule); ex.Error != nil {
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

	// Reload the schedule data to return in response
	if ex := handler.GetUserScopedDb(c).Model(schedule).Updates(updatedSchedule); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"schedule": updatedSchedule,
		"message":  "success",
	})
	return
}

func (handler *Handler) ScheduleDeleteHandler(c *gin.Context) {
	var (
		schedule   *models.Schedule
		scheduleId int
		err        error
	)

	// Get the user-scoped database from context

	if scheduleId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}

	// First find the schedule to ensure it belongs to the user
	schedule = &models.Schedule{}
	if ex := handler.GetUserScopedDb(c).Where("id = ?", uint(scheduleId)).First(schedule); ex.Error != nil {
		c.JSON(404, gin.H{
			"message": "Schedule not found",
		})
		return
	}

	// Then delete it using the handler's DB to avoid the ambiguous column issue
	if ex := handler.db.Delete(schedule); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"message": "success",
	})
	return
}
