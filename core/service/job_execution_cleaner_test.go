package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupCleanerTestDB(t *testing.T) *gorm.DB {
	// Use in-memory SQLite for testing
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	return db
}

func TestNewJobExecutionCleaner(t *testing.T) {
	db := setupCleanerTestDB(t)

	cleaner, err := NewJobExecutionCleaner(db)
	require.NoError(t, err)
	assert.NotNil(t, cleaner)
	assert.Equal(t, uint32(10), cleaner.AllowedJobExecutionsPerJob)
}