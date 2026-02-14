package api

import (
	"errors"

	"github.com/cronny/core/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ScopedDBKey is the key used to store the user-scoped database in the context
const ScopedDBKey = "scopedDB"

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

func (handler *Handler) GetUserScopedDb(c *gin.Context) (db *gorm.DB) {
	// Not checking if the scoped DB exists because it should always exist
	// and is set in the user_scope_middleware.
	scopedDB, _ := c.Get(ScopedDBKey)
	db = scopedDB.(*gorm.DB)

	return
}

func (handler *Handler) SaveWithUser(c *gin.Context, model interface{}) (err error) {
	userID, exists := GetUserID(c)
	if !exists {
		err = errors.New("user ID not found")
		return
	}

	// Set the UserID field on the model if it implements UserOwned interface
	if userOwned, ok := model.(models.UserOwned); ok {
		userOwned.SetUserID(userID)
	}

	err = handler.db.Save(model).Error
	return
}

func (handler *Handler) UpdateWithUser(c *gin.Context, prevModel, updatedModel interface{}) (err error) {
	userID, exists := GetUserID(c)
	if !exists {
		err = errors.New("user ID not found")
		return
	}

	// Set the UserID field on the model if it implements UserOwned interface
	if userOwned, ok := prevModel.(models.UserOwned); ok {
		userOwned.SetUserID(userID)
	}

	err = handler.db.Model(prevModel).Updates(updatedModel).Error
	return
}
