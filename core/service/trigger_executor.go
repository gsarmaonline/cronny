package service

import (
	"context"
	"time"

	"github.com/cronny/core/helpers"
	"github.com/cronny/core/models"
	"gorm.io/gorm"
)

const (
	ExecutorConcurrency = 10
)

type (
	TriggerExecutor struct {
		db        *gorm.DB
		triggerCh chan *models.Trigger
		ctx       context.Context
		cancel    context.CancelFunc
		logger    *helpers.Logger
	}
)

func NewTriggerExecutor(db *gorm.DB) (te *TriggerExecutor, err error) {
	ctx, cancel := context.WithCancel(context.Background())
	te = &TriggerExecutor{
		db:        db,
		triggerCh: make(chan *models.Trigger, 1024),
		ctx:       ctx,
		cancel:    cancel,
		logger:    helpers.NewLogger("TriggerExecutor"),
	}
	return
}

// Shutdown gracefully stops the trigger executor
func (te *TriggerExecutor) Shutdown() {
	te.logger.Info("Shutting down TriggerExecutor")
	te.cancel()
	close(te.triggerCh)
}

func (te *TriggerExecutor) ProcessOne(trigger *models.Trigger) (err error) {
	triggerExecStatus := models.CompletedTriggerStatus
	// Update the Trigger's status
	if err = trigger.UpdateStatus(te.db, models.ExecutingTriggerStatus); err != nil {
		return
	}
	// Create the next Trigger
	if _, err = trigger.Schedule.CreateTrigger(te.db); err != nil {
		return
	}
	// Execute the trigger
	if err = trigger.Execute(te.db); err != nil {
		triggerExecStatus = models.FailedTriggerStatus
	}
	// Update the trigger's executed status
	if err = trigger.UpdateStatus(te.db, triggerExecStatus); err != nil {
		return
	}
	return
}

func (te *TriggerExecutor) RunOneIter() (triggersProcessedCount int, err error) {
	var (
		triggers []*models.Trigger
		sTrig    models.Trigger
	)
	if triggers, err = sTrig.GetTriggersForTime(te.db, models.ScheduledTriggerStatus); err != nil {
		return
	}
	for _, trigger := range triggers {
		te.triggerCh <- trigger
	}
	return
}

func (te *TriggerExecutor) listenForTrigger() {
	for {
		select {
		case <-te.ctx.Done():
			te.logger.Info("Worker shutting down")
			return
		case trigger, ok := <-te.triggerCh:
			if !ok {
				// Channel closed
				return
			}
			if err := te.ProcessOne(trigger); err != nil {
				te.logger.Error("Failed to process trigger", err, "trigger_id", trigger.ID, "schedule_id", trigger.ScheduleID)
				// Don't return on error, continue processing
			}
		}
	}
}

func (te *TriggerExecutor) Run() (err error) {
	te.logger.Info("Starting TriggerExecutor", "workers", ExecutorConcurrency)

	// Start worker goroutines
	for idx := 0; idx < ExecutorConcurrency; idx++ {
		go te.listenForTrigger()
	}

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-te.ctx.Done():
			te.logger.Info("Main loop shutting down")
			return nil
		case <-ticker.C:
			triggersProcessedCount := 0
			if triggersProcessedCount, err = te.RunOneIter(); err != nil {
				te.logger.Error("Error in RunOneIter", err, "triggers_processed", triggersProcessedCount)
			}
		}
	}
}
