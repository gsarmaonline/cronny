package service

import (
	"context"
	"time"

	"github.com/cronny/core/helpers"
	"github.com/cronny/core/models"
	"gorm.io/gorm"
)

type (
	TriggerCreator struct {
		db     *gorm.DB
		ctx    context.Context
		cancel context.CancelFunc
		logger *helpers.Logger
	}
)

func NewTriggerCreator(db *gorm.DB) (tc *TriggerCreator, err error) {
	ctx, cancel := context.WithCancel(context.Background())
	tc = &TriggerCreator{
		db:     db,
		ctx:    ctx,
		cancel: cancel,
		logger: helpers.NewLogger("TriggerCreator"),
	}
	return
}

// Shutdown gracefully stops the trigger creator
func (tc *TriggerCreator) Shutdown() {
	tc.logger.Info("Shutting down TriggerCreator")
	tc.cancel()
}

func (tc *TriggerCreator) ProcessSchedule(schedule *models.Schedule) (trigger *models.Trigger, err error) {
	if trigger, err = schedule.CreateTrigger(tc.db); err != nil {
		return
	}
	if err = schedule.UpdateStatus(tc.db, models.ProcessingScheduleStatus); err != nil {
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
	tc.logger.Info("Starting TriggerCreator")

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-tc.ctx.Done():
			tc.logger.Info("Shutting down")
			return nil
		case <-ticker.C:
			schedProcessCount := 0
			if schedProcessCount, err = tc.RunOneIter(); err != nil {
				tc.logger.Error("Error in RunOneIter", err, "schedules_processed", schedProcessCount)
			}
		}
	}
}
