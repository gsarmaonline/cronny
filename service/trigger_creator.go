package service

import (
	"log"
	"time"

	"github.com/cronny/models"
	"gorm.io/gorm"
)

type (
	TriggerCreator struct {
		db *gorm.DB
	}
)

func NewTriggerCreator(db *gorm.DB) (tc *TriggerCreator, err error) {
	tc = &TriggerCreator{
		db: db,
	}
	return
}

func (tc *TriggerCreator) ProcessSchedule(schedule *models.Schedule) (trigger *models.Trigger, err error) {
	if trigger, err = schedule.CreateTrigger(tc.db); err != nil {
		return
	}
	if err = schedule.UpdateStatusWithLocks(tc.db, models.ProcessingScheduleStatus); err != nil {
		return
	}
	return
}

func (tc *TriggerCreator) RunOneIter() (schedProcessCount int, err error) {
	var (
		schedules []*models.Schedule
		sSched    models.Schedule
	)
	if schedules, err = sSched.GetSchedules(tc.db, models.PendingScheduleStatus); err != nil {
		return
	}
	for _, schedule := range schedules {
		if _, err = tc.ProcessSchedule(schedule); err != nil {
			return
		}
	}
	return
}

func (tc *TriggerCreator) Run() (err error) {
	for {
		schedProcessCount := 0
		if schedProcessCount, err = tc.RunOneIter(); err != nil {
			log.Println("Error in RunOneIter", err, schedProcessCount)
		}
		if schedProcessCount == 0 {
			time.Sleep(1 * time.Second)
		}

	}
	return
}
