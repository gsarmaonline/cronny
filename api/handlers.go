package api

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type (
	Handler struct {
		db *gorm.DB
	}
)

func NewHandler(db *gorm.DB) (handler *Handler, err error) {
	handler = &Handler{
		db: db,
	}
	return
}

func (handler *Handler) rootHandler(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "success",
	})
	return
}
