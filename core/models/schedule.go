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
		BaseModel

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

		User *User `json:"user"`
	}
)

func (schedule *Schedule) validateScheduleType() (err error) {
	switch schedule.ScheduleType {
	case AbsoluteScheduleType, RecurringScheduleType, RelativeScheduleType:
		return
	default:
		err = errors.New("ScheduleType not supported")
	}
	return
}

func (schedule *Schedule) validateScheduleUnit() (err error) {
	switch schedule.ScheduleUnit {
	case SecondScheduleUnit, MinuteScheduleUnit, HourScheduleUnit, DayScheduleUnit:
		return
	default:
		err = errors.New("ScheduleUnit not supported")
	}
	return
}

func (schedule *Schedule) validateScheduleValue() (err error) {
	switch schedule.ScheduleType {
	case AbsoluteScheduleType:
		// Validate RFC3339 format
		if _, err = time.Parse(time.RFC3339, schedule.ScheduleValue); err != nil {
			return fmt.Errorf("invalid schedule value for absolute schedule, must be RFC3339 format: %w", err)
		}
	case RecurringScheduleType, RelativeScheduleType:
		// Validate it's a valid integer
		if interval, err := strconv.Atoi(schedule.ScheduleValue); err != nil {
			return fmt.Errorf("invalid schedule value for recurring/relative schedule, must be an integer: %w", err)
		} else if interval <= 0 {
			return errors.New("schedule value must be greater than 0 for recurring/relative schedules")
		}
	}
	return nil
}

func (schedule *Schedule) validateEndsAt() (err error) {
	if schedule.EndsAt == "" {
		return nil
	}
	// Validate RFC3339 format
	if _, err = time.Parse(time.RFC3339, schedule.EndsAt); err != nil {
		return fmt.Errorf("invalid ends_at value, must be RFC3339 format: %w", err)
	}
	return nil
}

func (schedule *Schedule) BeforeSave(tx *gorm.DB) (err error) {
	if err = schedule.validateScheduleType(); err != nil {
		return
	}
	if err = schedule.validateScheduleUnit(); err != nil {
		return
	}
	if err = schedule.validateScheduleValue(); err != nil {
		return
	}
	if err = schedule.validateEndsAt(); err != nil {
		return
	}
	return
}

// ==========================================================
// Schedules
// UpdateStatus updates the schedule status
// Note: This does not use locks. For concurrent updates, use database transactions.
func (schedule *Schedule) UpdateStatus(db *gorm.DB, status ScheduleStatusT) (err error) {
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

func (schedule *Schedule) addTimeInterval(baseTime time.Time, interval int) time.Time {
	switch schedule.ScheduleUnit {
	case SecondScheduleUnit:
		return baseTime.Add(time.Duration(interval) * time.Second)
	case MinuteScheduleUnit:
		return baseTime.Add(time.Duration(interval) * time.Minute)
	case HourScheduleUnit:
		return baseTime.Add(time.Duration(interval) * time.Hour)
	case DayScheduleUnit:
		return baseTime.Add(time.Duration(interval) * 24 * time.Hour)
	default:
		return baseTime
	}
}

func (schedule *Schedule) GetRecurringExecutionTime() (execTime time.Time, err error) {
	var timeInterval int
	currTime := time.Now().UTC()

	if timeInterval, err = strconv.Atoi(schedule.ScheduleValue); err != nil {
		return
	}

	// Calculate the next occurrence based on current time
	execTime = schedule.addTimeInterval(currTime, timeInterval)

	// If the calculated time is in the past, adjust it to the next occurrence
	if execTime.Before(currTime) {
		execTime = schedule.addTimeInterval(execTime, timeInterval)
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
	case RecurringScheduleType:
		execTime, err = schedule.GetRecurringExecutionTime()
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
			return nil, fmt.Errorf("failed to end schedule %s (ID: %d): %w", schedule.Name, schedule.ID, err)
		}
		return nil, nil
	}
	if execTime, err = schedule.GetExecutionTime(); err != nil {
		return nil, fmt.Errorf("failed to get execution time for schedule %s (ID: %d): %w", schedule.Name, schedule.ID, err)
	}
	trigger = &Trigger{
		StartAt:       execTime,
		Schedule:      schedule,
		ScheduleID:    schedule.ID,
		TriggerStatus: ScheduledTriggerStatus,
	}
	if db = db.Create(trigger); db.Error != nil {
		return nil, fmt.Errorf("failed to create trigger for schedule %s (ID: %d): %w", schedule.Name, schedule.ID, db.Error)
	}
	return trigger, nil
}
