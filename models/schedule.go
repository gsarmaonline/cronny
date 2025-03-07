package models

import (
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"gorm.io/gorm"
)

const (

	// Schedule Types
	AbsoluteScheduleType  = ScheduleTypeT(1)
	RecurringScheduleType = ScheduleTypeT(2)
	RelativeScheduleType  = ScheduleTypeT(3)

	// Schedule Status
	PendingScheduleStatus    = ScheduleStatusT(1)
	ProcessingScheduleStatus = ScheduleStatusT(2)
	ProcessedScheduleStatus  = ScheduleStatusT(3)
	// This state will be used to check whether the configuration
	// of the entire Schedule is Valid
	InactiveScheduleStatus = ScheduleStatusT(4)

	// Schedule Units
	SecondScheduleUnit = "second"
	MinuteScheduleUnit = "minute"
	HourScheduleUnit   = "hour"
	DayScheduleUnit    = "day"
)

type (

	ScheduleTypeT   int
	ScheduleStatusT int

	Schedule struct {
		gorm.Model

		Name string `json:"name"`

		ScheduleExecType ExecTypeT `json:"schedule_exec_type"`
		ScheduleExecLink string    `json:"string"`

		ScheduleType  ScheduleTypeT `json:"schedule_type" gorm:"index"`
		ScheduleValue string        `json:"schedule_value"`
		ScheduleUnit  string        `json:"schedule_unit"`

		ScheduleStatus ScheduleStatusT `json:"schedule_status" gorm:"index"`

		EndsAt string `json:"ends_at"`

		Action   *Action `json:"action"`
		ActionID uint    `json:"action_id"`
	}
)

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
		return
	default:
		err = fmt.Errorf("ScheduleType not supported. Received ScheduleType %d", schedule.ScheduleType)
		return
	}
	return
}

func (schedule *Schedule) ShouldEnd(db *gorm.DB) (shouldEnd bool) {
	var (
		endsAt time.Time
		err    error
	)
	shouldEnd = false
	if schedule.EndsAt == "" {
		return
	}
	if endsAt, err = time.Parse(time.RFC3339, schedule.EndsAt); err != nil {
		return
	}
	if time.Now().UTC().After(endsAt) {
		shouldEnd = true
		return
	}
	return
}

func (schedule *Schedule) End(db *gorm.DB) (err error) {
	schedule.ScheduleStatus = ProcessedScheduleStatus
	if ex := db.Save(schedule); ex.Error != nil {
		err = ex.Error
		return
	}
	return
}

func (schedule *Schedule) CreateTrigger(db *gorm.DB) (trigger *Trigger, err error) {
	var (
		execTime time.Time
	)
	// If the schedule is supposed to end, then don't create
	// the next trigger
	if schedule.ShouldEnd(db) {
		if err = schedule.End(db); err != nil {
			return
		}
		return
	}
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