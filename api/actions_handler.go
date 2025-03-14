package api

import (
	"strconv"

	"github.com/cronny/models"
	"github.com/gin-gonic/gin"
)

func (handler *Handler) ActionIndexHandler(c *gin.Context) {
	var (
		actions []*models.Action
	)

	if ex := handler.db.Find(&actions); ex.Error != nil {
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

func (handler *Handler) ActionShowHandler(c *gin.Context) {
	var (
		action   *models.Action
		actionId int
		err      error
	)
	if actionId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.db.Preload("Jobs").Where("id = ?", actionId).First(&action); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"action":  action,
		"message": "success",
	})
	return
}

func (handler *Handler) ActionCreateHandler(c *gin.Context) {
	var (
		action *models.Action
		err    error
	)
	action = &models.Action{}
	if err = c.ShouldBindJSON(action); err != nil {
		c.JSON(400, gin.H{
			"message": err.Error(),
		})
		return
	}
	if ex := handler.db.Save(action); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"action":  action,
		"message": "success",
	})
	return
}

func (handler *Handler) ActionUpdateHandler(c *gin.Context) {
	var (
		action        *models.Action
		updatedAction *models.Action
		actionId      int
		err           error
	)
	action = &models.Action{}
	updatedAction = &models.Action{}

	if actionId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.db.Where("id = ?", uint(actionId)).First(action); ex.Error != nil {
		c.JSON(400, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	if err = c.ShouldBindJSON(updatedAction); err != nil {
		c.JSON(400, gin.H{
			"message": err.Error(),
		})
		return
	}
	if ex := handler.db.Model(action).Updates(updatedAction); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"action":  action,
		"message": "success",
	})
	return
}

func (handler *Handler) ActionDeleteHandler(c *gin.Context) {
	var (
		action   *models.Action
		actionId int
		err      error
	)
	if actionId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.db.Delete(&models.Action{}, actionId); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"action":  action,
		"message": "success",
	})
	return
}
