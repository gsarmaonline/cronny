package service

import (
	"errors"
	"fmt"
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

		ActionID uint `json:"action_id"`
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

		Schedule   *Schedule `json:"schedule"`
		ScheduleID uint      `json:"schedule_id"`

		Stages []*Stage `json:"stages"`
	}

	Stage struct {
		gorm.Model

		Name      string       `json:"name"`
		StageType StageTypeT   `json:"stage_type"`
		Output    StageOutputT `json:"output"`

		ActionID uint `json:"action_id"`
	}
)

func SetupModels(db *gorm.DB) (err error) {
	db.AutoMigrate(&Schedule{})
	db.AutoMigrate(&Trigger{})
	db.AutoMigrate(&Action{})
	db.AutoMigrate(&Stage{})
	return
}

// ==========================================================
// Schedules
func (schedule *Schedule) UpdateStatusWithLocks(db *gorm.DB, status ScheduleStatusT) (err error) {
	schedule.ScheduleStatus = status
	if db := db.Save(schedule); db.Error != nil {
		err = db.Error
		return
	}
	return
}

func (schedule Schedule) GetSchedules(db *gorm.DB, status ScheduleStatusT) (schedules []*Schedule, err error) {
	if db = db.Where("schedule_status = ?", PendingScheduleStatus).Find(&schedules); db.Error != nil {
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
	if db = db.Preload("Schedule").Where(
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
	return
}
