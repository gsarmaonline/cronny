package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTriggerExecutorTestDB(t *testing.T) *gorm.DB {
	// Use in-memory SQLite for testing
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	return db
}

func TestNewTriggerExecutor(t *testing.T) {
	db := setupTriggerExecutorTestDB(t)

	te, err := NewTriggerExecutor(db)
	require.NoError(t, err)
	assert.NotNil(t, te)
	assert.Equal(t, db, te.db)
	assert.NotNil(t, te.triggerCh)
	assert.Equal(t, 1024, cap(te.triggerCh))
}