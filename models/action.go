package models

import (
	"gorm.io/gorm"
)

const (
	// Schedule Execution Type
	InternalExecType = ExecTypeT(1)
	AwsExecType      = ExecTypeT(2)

)

type (
	ExecTypeT       int
	TriggerStatusT  int

	JobInputT  string
	JobOutputT string


	Action struct {
		gorm.Model

		Name string `json:"name"`
		Jobs []*Job `json:"jobs"`
	}
)


// ==========================================================
// Actions
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
