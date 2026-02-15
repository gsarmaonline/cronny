package service

import (
	"fmt"
	"testing"
	"time"

	"github.com/cronny/core/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupCleanerTestDB(t *testing.T) *gorm.DB {
	// Use unique in-memory SQLite database per test for isolation
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
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
// Test helpers
func createCleanerTestData(t *testing.T, db *gorm.DB) (*models.Job, *models.Action, *models.JobTemplate) {
	// Auto-migrate models
	require.NoError(t, db.AutoMigrate(
		&models.Job{},
		&models.JobExecution{},
		&models.Action{},
		&models.JobTemplate{},
		&models.User{},
	))

	// Create action
	action := &models.Action{
		Name:        "Test Action",
		Description: "Test",
	}
	action.SetUserID(1)
	require.NoError(t, db.Create(action).Error)

	// Create template
	template := &models.JobTemplate{
		Name: "logger",
	}
	template.SetUserID(1)
	require.NoError(t, db.Create(template).Error)

	// Create job
	job := &models.Job{
		Name:             "Test Job",
		ActionID:         action.ID,
		JobTemplateID:    template.ID,
		JobInputType:     models.StaticJsonInput,
		JobInputValue:    `{"message": "test"}`,
		IsRootJob:        true,
		JobTimeoutInSecs: 30,
	}
	job.SetUserID(1)
	require.NoError(t, db.Create(job).Error)

	return job, action, template
}

func createJobExecutions(t *testing.T, db *gorm.DB, jobID uint, count int) []*models.JobExecution {
	executions := make([]*models.JobExecution, count)
	baseTime := time.Now().UTC().Add(-time.Duration(count) * time.Hour)

	for i := 0; i < count; i++ {
		exec := &models.JobExecution{
			JobID:              jobID,
			Output:             models.JobOutputT(`{"execution": ` + fmt.Sprintf("%d", i) + `}`),
			ExecutionStartTime: baseTime.Add(time.Duration(i) * time.Hour),
			ExecutionStopTime:  baseTime.Add(time.Duration(i)*time.Hour + 1*time.Minute),
		}
		exec.SetUserID(1)
		require.NoError(t, db.Create(exec).Error)
		executions[i] = exec
	}

	return executions
}

func countJobExecutions(t *testing.T, db *gorm.DB, jobID uint) int {
	var count int64
	db.Model(&models.JobExecution{}).Where("job_id = ?", jobID).Count(&count)
	return int(count)
}

// ==========================================================
// TestJobExecutionCleaner_runIter

func TestJobExecutionCleaner_runIter_KeepsMostRecentExecutions(t *testing.T) {
	db := setupCleanerTestDB(t)
	job, _, _ := createCleanerTestData(t, db)

	// Create 15 executions (more than the default 10 allowed)
	createJobExecutions(t, db, job.ID, 15)

	cleaner, err := NewJobExecutionCleaner(db)
	require.NoError(t, err)

	// Run cleanup
	totalCleaned, err := cleaner.runIter()
	assert.NoError(t, err, "runIter should not error")
	assert.Equal(t, uint32(5), totalCleaned, "Should clean 5 executions (15 - 10)")

	// Verify only 10 executions remain
	remaining := countJobExecutions(t, db, job.ID)
	assert.Equal(t, 10, remaining, "Should keep exactly 10 most recent executions")
}

func TestJobExecutionCleaner_runIter_DeletesOlderExecutions(t *testing.T) {
	db := setupCleanerTestDB(t)
	job, _, _ := createCleanerTestData(t, db)

	// Create 12 executions
	executions := createJobExecutions(t, db, job.ID, 12)

	cleaner, err := NewJobExecutionCleaner(db)
	require.NoError(t, err)

	// Run cleanup
	_, err = cleaner.runIter()
	assert.NoError(t, err)

	// Verify the oldest 2 were deleted (indices 0 and 1)
	var found models.JobExecution
	err = db.First(&found, executions[0].ID).Error
	assert.Error(t, err, "Oldest execution should be deleted")

	err = db.First(&found, executions[1].ID).Error
	assert.Error(t, err, "Second oldest execution should be deleted")

	// Verify the newest execution still exists (index 11)
	err = db.First(&found, executions[11].ID).Error
	assert.NoError(t, err, "Newest execution should still exist")
}

func TestJobExecutionCleaner_runIter_FewerThanAllowedExecutions(t *testing.T) {
	db := setupCleanerTestDB(t)
	job, _, _ := createCleanerTestData(t, db)

	// Create only 5 executions (less than the default 10 allowed)
	createJobExecutions(t, db, job.ID, 5)

	cleaner, err := NewJobExecutionCleaner(db)
	require.NoError(t, err)

	// Run cleanup
	totalCleaned, err := cleaner.runIter()
	assert.NoError(t, err, "runIter should not error")

	// Should not delete any executions when under the limit
	assert.Equal(t, uint32(0), totalCleaned, "Should not delete any executions when under limit")

	// Verify all executions are still present
	remaining := countJobExecutions(t, db, job.ID)
	assert.Equal(t, 5, remaining, "All executions should be kept when under limit")
}

func TestJobExecutionCleaner_runIter_ExactlyAllowedExecutions(t *testing.T) {
	db := setupCleanerTestDB(t)
	job, _, _ := createCleanerTestData(t, db)

	// Create exactly 10 executions (equal to the default allowed)
	createJobExecutions(t, db, job.ID, 10)

	cleaner, err := NewJobExecutionCleaner(db)
	require.NoError(t, err)

	// Run cleanup
	totalCleaned, err := cleaner.runIter()
	assert.NoError(t, err, "runIter should not error")

	// Should not delete any executions when exactly at the limit
	assert.Equal(t, uint32(0), totalCleaned, "Should not delete any executions when at limit")

	// Verify all executions are still present
	remaining := countJobExecutions(t, db, job.ID)
	assert.Equal(t, 10, remaining, "All executions should be kept when at limit")
}

func TestJobExecutionCleaner_runIter_MultipleJobs(t *testing.T) {
	db := setupCleanerTestDB(t)

	// Create first job with 15 executions
	job1, action, template := createCleanerTestData(t, db)
	createJobExecutions(t, db, job1.ID, 15)

	// Create second job with 12 executions
	job2 := &models.Job{
		Name:             "Test Job 2",
		ActionID:         action.ID,
		JobTemplateID:    template.ID,
		JobInputType:     models.StaticJsonInput,
		JobInputValue:    `{"message": "test2"}`,
		IsRootJob:        false,
		JobTimeoutInSecs: 30,
	}
	job2.SetUserID(1)
	db.Create(job2)
	createJobExecutions(t, db, job2.ID, 12)

	cleaner, err := NewJobExecutionCleaner(db)
	require.NoError(t, err)

	// Run cleanup
	totalCleaned, err := cleaner.runIter()
	assert.NoError(t, err, "runIter should not error")
	assert.Equal(t, uint32(7), totalCleaned, "Should clean 5 from job1 + 2 from job2")

	// Verify correct counts for each job
	assert.Equal(t, 10, countJobExecutions(t, db, job1.ID), "Job1 should have 10 executions")
	assert.Equal(t, 10, countJobExecutions(t, db, job2.ID), "Job2 should have 10 executions")
}

func TestJobExecutionCleaner_runIter_NoJobs(t *testing.T) {
	db := setupCleanerTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.Job{}, &models.JobExecution{}))

	cleaner, err := NewJobExecutionCleaner(db)
	require.NoError(t, err)

	// Run cleanup with no jobs
	totalCleaned, err := cleaner.runIter()
	assert.NoError(t, err, "runIter should not error with no jobs")
	assert.Equal(t, uint32(0), totalCleaned, "Should clean 0 executions")
}

func TestJobExecutionCleaner_runIter_JobWithNoExecutions(t *testing.T) {
	db := setupCleanerTestDB(t)
	_, _, _ = createCleanerTestData(t, db)

	// Don't create any executions for the job

	cleaner, err := NewJobExecutionCleaner(db)
	require.NoError(t, err)

	// Run cleanup
	totalCleaned, err := cleaner.runIter()
	assert.NoError(t, err, "runIter should not error with job having no executions")
	assert.Equal(t, uint32(0), totalCleaned, "Should clean 0 executions")
}

func TestJobExecutionCleaner_runIter_CustomAllowedCount(t *testing.T) {
	db := setupCleanerTestDB(t)
	job, _, _ := createCleanerTestData(t, db)

	// Create 10 executions
	createJobExecutions(t, db, job.ID, 10)

	cleaner, err := NewJobExecutionCleaner(db)
	require.NoError(t, err)

	// Set custom allowed count
	cleaner.AllowedJobExecutionsPerJob = 5

	// Run cleanup
	totalCleaned, err := cleaner.runIter()
	assert.NoError(t, err, "runIter should not error")
	assert.Equal(t, uint32(5), totalCleaned, "Should clean 5 executions (10 - 5)")

	// Verify only 5 executions remain
	remaining := countJobExecutions(t, db, job.ID)
	assert.Equal(t, 5, remaining, "Should keep exactly 5 most recent executions")
}

func TestJobExecutionCleaner_runIter_OrdersByExecutionStopTime(t *testing.T) {
	db := setupCleanerTestDB(t)
	job, _, _ := createCleanerTestData(t, db)

	// Create more executions than allowed to test the cleanup logic works when it should
	baseTime := time.Now().UTC()
	for i := 0; i < 15; i++ {
		exec := &models.JobExecution{
			JobID:              job.ID,
			Output:             models.JobOutputT(fmt.Sprintf(`{"id": %d}`, i)),
			ExecutionStartTime: baseTime,
			ExecutionStopTime:  baseTime.Add(time.Duration(i) * time.Hour),
		}
		exec.SetUserID(1)
		db.Create(exec)
	}

	cleaner, err := NewJobExecutionCleaner(db)
	require.NoError(t, err)
	// Default is 10, so should delete 5 oldest

	// Run cleanup
	totalCleaned, err := cleaner.runIter()
	assert.NoError(t, err, "runIter should not error")
	assert.Equal(t, uint32(5), totalCleaned, "Should delete 5 oldest executions")

	// Verify exactly 10 executions remain
	remaining := countJobExecutions(t, db, job.ID)
	assert.Equal(t, 10, remaining, "Should keep exactly 10 most recent executions")
}

// ==========================================================
// TestJobExecutionCleaner_Constructor

func TestJobExecutionCleaner_Constructor_SetsDefaultValues(t *testing.T) {
	db := setupCleanerTestDB(t)

	cleaner, err := NewJobExecutionCleaner(db)
	require.NoError(t, err, "NewJobExecutionCleaner should not error")
	assert.NotNil(t, cleaner, "Cleaner should not be nil")
	assert.Equal(t, db, cleaner.db, "Database should be set correctly")
	assert.Equal(t, uint32(10), cleaner.AllowedJobExecutionsPerJob, "Default allowed executions should be 10")
}
