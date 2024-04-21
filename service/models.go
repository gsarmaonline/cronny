package service

import (
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"gorm.io/gorm"
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
)

func SetupModels(db *gorm.DB) (err error) {
	db.AutoMigrate(&Schedule{})
	db.AutoMigrate(&Trigger{})
	db.AutoMigrate(&Action{})
	db.AutoMigrate(&Job{})
	db.AutoMigrate(&JobTemplate{})
	db.AutoMigrate(&JobExecution{})
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

func (schedule *Schedule) GetRelativeExecutionTime() (execTime time.Time, err error) {
	var (
		timeInterval int
	)
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

func (schedule *Schedule) GetAbsoluteExecutionTime() (execTime time.Time, err error) {
	if execTime, err = time.Parse(time.RFC3339, schedule.ScheduleValue); err != nil {
		log.Println(err)
		return
	}
	return
}

func (schedule *Schedule) GetExecutionTime() (execTime time.Time, err error) {
	switch schedule.ScheduleType {
	case RelativeScheduleType:
		execTime, err = schedule.GetRelativeExecutionTime()
		return
	case AbsoluteScheduleType:
		execTime, err = schedule.GetAbsoluteExecutionTime()
	default:
		err = fmt.Errorf("ScheduleType not supported. Received ScheduleType %s", schedule.ScheduleType)
		return
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
	log.Println("Executing Trigger for Schedule", trigger.Schedule.Name, "with ID", trigger.ScheduleID)
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
