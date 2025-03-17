package api

import (
	"errors"

	"github.com/cronny/models"
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

func (handler *Handler) GetUserScopedDb(c *gin.Context, db *gorm.DB) (newDb *gorm.DB, err error) {
	if db == nil {
		db = handler.db
	}

	userID, exists := GetUserID(c)
	if !exists {
		err = errors.New("user ID not found")
		return
	}

	newDb = db.Where("user_id = ?", userID)
	return
}

func (handler *Handler) SaveWithUser(c *gin.Context, db *gorm.DB, model interface{}) (err error) {
	if db == nil {
		db = handler.db
	}

	userID, exists := GetUserID(c)
	if !exists {
		err = errors.New("user ID not found")
		return
	}

	// Set the UserID field on the model if it implements UserOwned interface
	if userOwned, ok := model.(models.UserOwned); ok {
		userOwned.SetUserID(userID)
	}

	err = db.Save(model).Error
	return
}
