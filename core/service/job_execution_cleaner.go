package service

import (
	"log"
	"time"

	"github.com/cronny/core/models"
	"gorm.io/gorm"
)

type (
	JobExecutionCleaner struct {
		db *gorm.DB

		AllowedJobExecutionsPerJob uint32
	}
)

func NewJobExecutionCleaner(db *gorm.DB) (execCleaner *JobExecutionCleaner, err error) {
	execCleaner = &JobExecutionCleaner{
		db:                         db,
		AllowedJobExecutionsPerJob: 10,
	}
	return
}

func (execCleaner *JobExecutionCleaner) runIter() (totalCleaned uint32, err error) {
	jobs := []*models.Job{}
	if ex := execCleaner.db.Find(&jobs); ex.Error != nil {
		err = ex.Error
		return
	}
	for _, job := range jobs {
		jobExecutions := []*models.JobExecution{}
		if ex := execCleaner.db.Where("job_id = ?", job.ID).Order("execution_stop_time").Find(&jobExecutions); ex.Error != nil {
			err = ex.Error
			return
		}
		if len(jobExecutions) > int(execCleaner.AllowedJobExecutionsPerJob) {
			toCleanIdx := len(jobExecutions) - int(execCleaner.AllowedJobExecutionsPerJob)
			jobExecutions = jobExecutions[0:toCleanIdx]
		}
		for _, jobExecution := range jobExecutions {
			if ex := execCleaner.db.Delete(&models.JobExecution{}, jobExecution.ID); ex.Error != nil {
				err = ex.Error
				return
			}
			totalCleaned += 1
		}
	}
	return
}

func (execCleaner *JobExecutionCleaner) Run() (err error) {
	log.Println("[JobExecutionCleaner] Starting JobExecutionCleaner service")
	for {
		var (
			totalCleaned uint32
		)
		if totalCleaned, err = execCleaner.runIter(); err != nil {
			log.Println("[JobExecutionCleaner]", err)
			continue
		}
		if totalCleaned != 0 {
			log.Println("[JobExecutionCleaner] Total executions cleaned", totalCleaned)
		}
		time.Sleep(1 * time.Minute)
	}
	return
}
