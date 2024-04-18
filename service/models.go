package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"gorm.io/gorm"

	"github.com/cronny/actions"
)

const (
	// Schedule Execution Type
	InternalExecType = ExecTypeT(1)
	AwsExecType      = ExecTypeT(2)

	// Schedule Types
	AbsoluteScheduleType  = ScheduleTypeT(1)
	RecurringScheduleType = ScheduleTypeT(2)
	RelativeScheduleType  = ScheduleTypeT(3)

	// Schedule Status
	PendingScheduleStatus    = ScheduleStatusT(1)
	ProcessingScheduleStatus = ScheduleStatusT(2)
	ProcessedScheduleStatus  = ScheduleStatusT(3)

	// Trigger Status
	ScheduledTriggerStatus = TriggerStatusT(1)
	ExecutingTriggerStatus = TriggerStatusT(2)
	CompletedTriggerStatus = TriggerStatusT(3)
	FailedTriggerStatus    = TriggerStatusT(4)

	// Schedule Units
	SecondScheduleUnit = "second"
	MinuteScheduleUnit = "minute"
	HourScheduleUnit   = "hour"
	DayScheduleUnit    = "day"

	// Job Inputs
	StaticJsonInput  = JobInputT("static_input")
	JobOutputAsInput = JobInputT("job_output_as_input")
)

var (
	JobMaps = map[string]actions.ActionExecutor{
		"http": actions.HttpAction{},
	}
)

type (
	ExecTypeT       int
	ScheduleTypeT   int
	ScheduleStatusT int
	TriggerStatusT  int

	JobInputT  string
	JobOutputT string

	Schedule struct {
		gorm.Model

		Name string `json:"name"`

		ScheduleExecType ExecTypeT `json:"schedule_exec_type"`
		ScheduleExecLink string    `json:"string"`

		ScheduleType  ScheduleTypeT `json:"schedule_type" gorm:"index"`
		ScheduleValue string        `json:"schedule_value"`
		ScheduleUnit  string        `json:"schedule_unit"`

		ScheduleStatus ScheduleStatusT `json:"schedule_status" gorm:"index"`

		Action   *Action `json:"action"`
		ActionID uint    `json:"action_id"`
	}

	Trigger struct {
		gorm.Model

		StartAt time.Time `json:"start_at" gorm:"index"`

		Schedule   *Schedule `json:"schedule"`
		ScheduleID uint      `json:"schedule_id"`

		TriggerStatus TriggerStatusT `json:"trigger_status" gorm:"index"`
	}

	Action struct {
		gorm.Model

		Name string `json:"name"`
		Jobs []*Job `json:"jobs"`
	}

	Job struct {
		gorm.Model

		Name    string     `json:"name"`
		JobType string     `json:"job_type"`
		Output  JobOutputT `json:"output"`

		JobInputType  JobInputT `json:"job_input_type"`
		JobInputValue string    `json:"job_input_value"`

		ActionID uint    `json:"action_id"`
		Action   *Action `json:"action"`

		JobTemplateID uint         `json:"job_template_id"`
		JobTemplate   *JobTemplate `json:"job_template"`

		Condition string `json:"condition"`
		IsRootJob bool   `json:"is_root_job"`

		ProceedCondition string `json:"proceed_condition"`

		ExecutionStartTime time.Time `json:"execution_start_time" gorm:"type:TIMESTAMP;null;default:null"`
		ExecutionStopTime  time.Time `json:"execution_stop_time" gorm:"type:TIMESTAMP;null;default:null"`
	}

	JobTemplate struct {
		gorm.Model

		Name string `json:"job_template"`

		ExecType ExecTypeT `json:"exec_type"`
		ExecLink string    `json:"exec_link"`
	}
)

func SetupModels(db *gorm.DB) (err error) {
	db.AutoMigrate(&Schedule{})
	db.AutoMigrate(&Trigger{})
	db.AutoMigrate(&Action{})
	db.AutoMigrate(&Job{})
	return
}

// ==========================================================
// Schedules
func (schedule *Schedule) UpdateStatusWithLocks(db *gorm.DB, status ScheduleStatusT) (err error) {
	schedule.ScheduleStatus = status
	if ex := db.Save(schedule); ex.Error != nil {
		err = ex.Error
		return
	}
	return
}

func (schedule Schedule) GetSchedules(db *gorm.DB, status ScheduleStatusT) (schedules []*Schedule, err error) {
	if ex := db.Where("schedule_status = ?", PendingScheduleStatus).Find(&schedules); ex.Error != nil {
		err = ex.Error
		return
	}
	return
}

func (schedule *Schedule) GetExecutionTime() (execTime time.Time, err error) {
	var (
		timeInterval int
	)
	if schedule.ScheduleType != RelativeScheduleType {
		err = errors.New("ScheduleType not supported")
		return
	}
	currTime := time.Now().UTC()
	if timeInterval, err = strconv.Atoi(schedule.ScheduleValue); err != nil {
		return
	}

	switch schedule.ScheduleUnit {
	case SecondScheduleUnit:
		execTime = currTime.Add(time.Duration(timeInterval) * time.Second)
	case MinuteScheduleUnit:
		execTime = currTime.Add(time.Duration(timeInterval) * time.Minute)
	case HourScheduleUnit:
		execTime = currTime.Add(time.Duration(timeInterval) * time.Hour)
	case DayScheduleUnit:
		execTime = currTime.Add(time.Duration(timeInterval) * time.Hour * 24)
	default:
		err = errors.New("ScheduleUnit not supported")
	}
	return
}

func (schedule *Schedule) CreateTrigger(db *gorm.DB) (trigger *Trigger, err error) {
	var (
		execTime time.Time
	)
	if execTime, err = schedule.GetExecutionTime(); err != nil {
		return
	}
	trigger = &Trigger{
		StartAt:       execTime,
		Schedule:      schedule,
		ScheduleID:    schedule.ID,
		TriggerStatus: ScheduledTriggerStatus,
	}
	if db = db.Create(trigger); db.Error != nil {
		err = db.Error
		return
	}
	return
}

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
	fmt.Println("Executing Trigger for Schedule", trigger.Schedule.Name)
	if err = trigger.Schedule.Action.Execute(db); err != nil {
		return
	}
	return
}

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

// ==========================================================
// Job
func (job *Job) GetInput() (input actions.Input, err error) {
	input = make(actions.Input)

	switch job.JobInputType {
	case StaticJsonInput:
		if err = json.Unmarshal([]byte(job.JobInputValue), &input); err != nil {
			return
		}
	default:
		err = fmt.Errorf("No JobInputType matched for %s", job.JobInputType)
		return
	}
	return
}

func (job *Job) Execute(db *gorm.DB) (err error) {
	var (
		isPresent      bool
		actionExecutor actions.ActionExecutor
		inp            actions.Input
		output         actions.Output
		outputB        []byte
		nextJob        *Job
	)
	log.Println("Executing Job ", job.Name)
	job.ExecutionStartTime = time.Now().UTC()

	if inp, err = job.GetInput(); err != nil {
		return
	}
	if actionExecutor, isPresent = JobMaps[job.JobType]; !isPresent {
		err = errors.New(fmt.Sprintf("JobType %s not defined", job.JobType))
		return
	}
	if output, err = actionExecutor.Execute(inp); err != nil {
		return
	}
	if outputB, err = json.Marshal(output); err != nil {
		return
	}

	job.Output = JobOutputT(string(outputB))
	job.ExecutionStopTime = time.Now().UTC()

	if ex := db.Save(job); ex.Error != nil {
		err = ex.Error
		return
	}

	if nextJob, err = job.Next(db); err != nil {
		return
	}

	if err = nextJob.Execute(db); err != nil {
		return
	}
	return
}

func (job *Job) Next(db *gorm.DB) (nextJob *Job, err error) {
	var (
		condition *Condition
		nextJobID uint
		input     actions.Input
	)
	condition = &Condition{}
	nextJob = &Job{}
	input = make(actions.Input)

	if err = json.Unmarshal([]byte(job.Condition), condition); err != nil {
		return
	}
	if err = json.Unmarshal([]byte(job.Output), &input); err != nil {
		return
	}
	if nextJobID, err = condition.GetNextJobID(input); err != nil {
		return
	}
	if ex := db.Where("id = ?", nextJobID).First(nextJob); ex.Error != nil {
		err = ex.Error
		return
	}

	return
}
