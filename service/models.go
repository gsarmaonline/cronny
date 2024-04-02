package service

import (
	"errors"
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
	ScheduleTypeT   int
	ScheduleStatusT int
	TriggerStatusT  int

	StageTypeT   int
	StageOutputT string

	Schedule struct {
		gorm.Model

		Name string `json:"name"`

		ScheduleType  ScheduleTypeT `json:"schedule_type" gorm:"index"`
		ScheduleValue string        `json:"schedule_value"`
		ScheduleUnit  string        `json:"schedule_unit"`

		ScheduleStatus ScheduleStatusT `json:"schedule_status" gorm:"index"`

		ActionID uint   `json:"action_id"`
		Action   Action `json:"action"`
	}

	Trigger struct {
		StartAt time.Time `json:"start_at"`

		Schedule   Schedule `json:"schedule"`
		ScheduleID uint     `json:"schedule_id"`

		TriggerStatus TriggerStatusT `json:"trigger_status" gorm:"index"`
	}

	Action struct {
		Name   string  `json:"name"`
		Stages []Stage `json:"stages"`
	}

	Stage struct {
		Name      string       `json:"name"`
		StageType StageTypeT   `json:"stage_type"`
		Output    StageOutputT `json:"output"`

		ActionID uint   `json:"action_id"`
		Action   Action `json:"action"`
	}
)

func SetupModels(db *gorm.DB) (err error) {
	db.AutoMigrate(&Schedule{})
	db.AutoMigrate(&Trigger{})
	db.AutoMigrate(&Action{})
	db.AutoMigrate(&Stage{})
	return
}

func (schedule *Schedule) UpdateStatusWithLocks(db *gorm.DB, status ScheduleStatusT) (err error) {
	schedule.ScheduleStatus = ProcessingScheduleStatus
	if db := db.Save(schedule); db.Error != nil {
		err = db.Error
		return
	}
	return
}

func (schedule Schedule) GetSchedules(db *gorm.DB, status ScheduleStatusT) (schedules []*Schedule, err error) {
	if db = db.Where("status in ?", PendingScheduleStatus).Find(schedules); db.Error != nil {
		err = db.Error
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
	if timeInterval, err = strconv.Atoi(schedule.ScheduleUnit); err != nil {
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
