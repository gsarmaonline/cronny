package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTriggerCreatorTestDB(t *testing.T) *gorm.DB {
	// Use in-memory SQLite for testing
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	return db
}

func TestNewTriggerCreator(t *testing.T) {
	db := setupTriggerCreatorTestDB(t)

	tc, err := NewTriggerCreator(db)
	require.NoError(t, err)
	assert.NotNil(t, tc)
	assert.Equal(t, db, tc.db)
}