package api

import (
	"strconv"

	"github.com/cronny/service"
	"github.com/gin-gonic/gin"
)

func (handler *Handler) StageCreateHandler(c *gin.Context) {
	var (
		stage *service.Stage
		err   error
	)
	stage = &service.Stage{}
	if err = c.ShouldBindJSON(stage); err != nil {
		c.JSON(400, gin.H{
			"message": err.Error(),
		})
		return
	}
	if ex := handler.db.Save(stage); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"stage":   stage,
		"message": "success",
	})
	return
}

func (handler *Handler) StageUpdateHandler(c *gin.Context) {
	var (
		stage        *service.Stage
		updatedStage *service.Stage
		stageId      int
		err          error
	)
	stage = &service.Stage{}
	updatedStage = &service.Stage{}

	if stageId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.db.Where("id = ?", uint(stageId)).First(stage); ex.Error != nil {
		c.JSON(400, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	if err = c.ShouldBindJSON(updatedStage); err != nil {
		c.JSON(400, gin.H{
			"message": err.Error(),
		})
		return
	}
	if ex := handler.db.Model(stage).Updates(updatedStage); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"stage":   stage,
		"message": "success",
	})
	return
}

func (handler *Handler) StageDeleteHandler(c *gin.Context) {
	var (
		stage   *service.Stage
		stageId int
		err     error
	)
	if stageId, err = strconv.Atoi(c.Param("id")); err != nil {
		c.JSON(400, gin.H{
			"message": "Improper ID format",
		})
		return
	}
	if ex := handler.db.Delete(&service.Stage{}, stageId); ex.Error != nil {
		c.JSON(500, gin.H{
			"message": ex.Error.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"stage":   stage,
		"message": "success",
	})
	return
}
