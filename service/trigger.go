package service

import (
	"log"
	"time"

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

func (tc *TriggerCreator) ProcessSchedule(schedule *Schedule) (err error) {
	var (
		execTime time.Time
		trigger  *Trigger
	)
	if execTime, err = schedule.GetExecutionTime(); err != nil {
		return
	}
	trigger = &Trigger{
		StartAt:       execTime,
		Schedule:      *schedule,
		ScheduleID:    schedule.ID,
		TriggerStatus: ScheduledTriggerStatus,
	}
	if db := tc.db.Create(trigger); db.Error != nil {
		err = db.Error
		return
	}
	if err = schedule.UpdateStatusWithLocks(tc.db, ProcessingScheduleStatus); err != nil {
		return
	}
	return
}

func (tc *TriggerCreator) RunOneIter() (schedProcessCount int, err error) {
	var (
		schedules []*Schedule
		sSched    Schedule
	)
	if schedules, err = sSched.GetSchedules(tc.db, PendingScheduleStatus); err != nil {
		return
	}
	for _, schedule := range schedules {
		if err = tc.ProcessSchedule(schedule); err != nil {
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
