package service

import (
	"log"
	"time"

	"gorm.io/gorm"
)

const (
	ExecutorConcurrency = 10
)

type (
	TriggerExecutor struct {
		db        *gorm.DB
		triggerCh chan *Trigger
	}
)

func NewTriggerExecutor(db *gorm.DB) (te *TriggerExecutor, err error) {
	te = &TriggerExecutor{
		db:        db,
		triggerCh: make(chan *Trigger, 1024),
	}
	return
}

func (te *TriggerExecutor) ProcessOne(trigger *Trigger) (err error) {
	triggerExecStatus := CompletedTriggerStatus
	// Update the Trigger's status
	if err = trigger.UpdateStatusWithLocks(te.db, ExecutingTriggerStatus); err != nil {
		return
	}
	// Create the next Trigger
	if _, err = trigger.Schedule.CreateTrigger(te.db); err != nil {
		return
	}
	// Execute the trigger
	if err = trigger.Execute(te.db); err != nil {
		triggerExecStatus = FailedTriggerStatus
	}
	// Update the trigger's executed status
	if err = trigger.UpdateStatusWithLocks(te.db, triggerExecStatus); err != nil {
		return
	}
	return
}

func (te *TriggerExecutor) RunOneIter() (triggersProcessedCount int, err error) {
	var (
		triggers []*Trigger
		sTrig    Trigger
	)
	if triggers, err = sTrig.GetTriggersForTime(te.db, ScheduledTriggerStatus); err != nil {
		return
	}
	for _, trigger := range triggers {
		te.triggerCh <- trigger
	}
	return
}

func (te *TriggerExecutor) listenForTrigger() (err error) {
	for {
		select {
		case trigger := <-te.triggerCh:
			if err = te.ProcessOne(trigger); err != nil {
				log.Println("Error while Processing Trigger", trigger, err)
				return
			}
		}
	}
	return
}

func (te *TriggerExecutor) Run() (err error) {

	for idx := 0; idx < ExecutorConcurrency; idx++ {
		go te.listenForTrigger()
	}
	for {
		triggersProcessedCount := 0
		if triggersProcessedCount, err = te.RunOneIter(); err != nil {
			log.Println("Error in RunOneIter", err, triggersProcessedCount)
		}
		if triggersProcessedCount == 0 {
			time.Sleep(1 * time.Second)
		}

	}
	return
}
