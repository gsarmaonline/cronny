package models

import (
	"log"
	"time"

	"gorm.io/gorm"
)

const (

	// Trigger Status
	ScheduledTriggerStatus = TriggerStatusT(1)
	ExecutingTriggerStatus = TriggerStatusT(2)
	CompletedTriggerStatus = TriggerStatusT(3)
	FailedTriggerStatus    = TriggerStatusT(4)

)

type (

	Trigger struct {
		gorm.Model

		StartAt time.Time `json:"start_at" gorm:"index"`

		Schedule   *Schedule `json:"schedule"`
		ScheduleID uint      `json:"schedule_id"`

		TriggerStatus TriggerStatusT `json:"trigger_status" gorm:"index"`
	}

)

// ==========================================================
// Triggers
func (trigger Trigger) GetTriggersForTime(db *gorm.DB, status TriggerStatusT) (triggers []*Trigger, err error) {
	if db = db.Preload("Schedule.Action").Where(
		"trigger_status = ? AND start_at < ?",
		ScheduledTriggerStatus,
		time.Now().UTC(),
	).Find(&triggers); db.Error != nil {

		err = db.Error
		return
	}
	return
}

func (trigger *Trigger) UpdateStatusWithLocks(db *gorm.DB, status TriggerStatusT) (err error) {
	trigger.TriggerStatus = status
	if db := db.Save(trigger); db.Error != nil {
		err = db.Error
		return
	}
	return
}

func (trigger *Trigger) Execute(db *gorm.DB) (err error) {
	log.Println("Executing Trigger for Schedule", trigger.Schedule.Name, "with ID", trigger.ScheduleID)
	if err = trigger.Schedule.Action.Execute(db); err != nil {
		return
	}
	return
}
