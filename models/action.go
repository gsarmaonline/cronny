package models

import (
	"fmt"

	"gorm.io/gorm"
)

const (
	// Schedule Execution Type
	InternalExecType = ExecTypeT(1)
	AwsExecType      = ExecTypeT(2)
)

type (
	ExecTypeT      int
	TriggerStatusT int

	JobInputT  string
	JobOutputT string

	Action struct {
		BaseModel

		Name        string `json:"name"`
		Description string `json:"description"`
		Jobs        []*Job `json:"jobs"`

		User *User `json:"user"`
	}
)

// ==========================================================
// Actions

func (action *Action) validateJobAssociations(db *gorm.DB) (err error) {
	var (
		jobs []*Job
	)
	if err = db.Where("action_id = ?", action.ID).Find(&jobs).Error; err != nil {
		return
	}
	if len(jobs) > 0 {
		err = fmt.Errorf("Action is connected to %d jobs. Disassociate them first.", len(jobs))
		return
	}
	return
}

func (action *Action) validateScheduleAssociations(db *gorm.DB) (err error) {
	var (
		schedules []*Schedule
	)
	if err = db.Where("action_id = ?", action.ID).Find(&schedules).Error; err != nil {
		return
	}
	if len(schedules) > 0 {
		err = fmt.Errorf("Action is connected to %d schedules. Disassociate them first.", len(schedules))
		return
	}
	return
}

func (action *Action) BeforeDelete(tx *gorm.DB) (err error) {
	if err = action.validateScheduleAssociations(tx); err != nil {
		return
	}
	if err = action.validateJobAssociations(tx); err != nil {
		return
	}
	return
}

func (action *Action) Execute(db *gorm.DB) (err error) {
	job := &Job{}
	if ex := db.Where("is_root_job = ? AND action_id = ?", true, action.ID).First(job); ex.Error != nil {
		err = ex.Error
		return
	}
	if err = job.Execute(db); err != nil {
		return
	}
	return
}
