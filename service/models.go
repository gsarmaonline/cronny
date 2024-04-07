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

	// Stage Inputs
	StaticJsonInput    = StageInputT("static_input")
	StageOutputAsInput = StageInputT("stage_output_as_input")
)

var (
	StageMaps = map[string]actions.ActionExecutor{
		"http": actions.HttpAction{},
	}
)

type (
	ScheduleTypeT   int
	ScheduleStatusT int
	TriggerStatusT  int

	StageInputT  string
	StageOutputT string

	Schedule struct {
		gorm.Model

		Name string `json:"name"`

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

		Name   string   `json:"name"`
		Stages []*Stage `json:"stages"`
	}

	Stage struct {
		gorm.Model

		Name      string       `json:"name"`
		StageType string       `json:"stage_type"`
		Output    StageOutputT `json:"output"`

		StageInputType  StageInputT `json:"stage_input_type"`
		StageInputValue string      `json:"stage_input_value"`

		ActionID uint    `json:"action_id"`
		Action   *Action `json:"action"`

		Condition   string `json:"condition"`
		IsRootStage bool   `json:"is_root_stage"`

		ProceedCondition string `json:"proceed_condition"`

		ExecutionStartTime time.Time `json:"execution_start_time" gorm:"type:TIMESTAMP;null;default:null"`
		ExecutionStopTime  time.Time `json:"execution_stop_time" gorm:"type:TIMESTAMP;null;default:null"`
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
	stage := &Stage{}
	if ex := db.Where("is_root_stage = ? AND action_id = ?", true, action.ID).First(stage); ex.Error != nil {
		err = ex.Error
		return
	}
	if err = stage.Execute(db); err != nil {
		return
	}
	return
}

// ==========================================================
// Stage
func (stage *Stage) GetInput() (input actions.Input, err error) {
	input = make(actions.Input)

	switch stage.StageInputType {
	case StaticJsonInput:
		if err = json.Unmarshal([]byte(stage.StageInputValue), &input); err != nil {
			return
		}
	default:
		err = fmt.Errorf("No StageInputType matched for %s", stage.StageInputType)
		return
	}
	return
}

func (stage *Stage) Execute(db *gorm.DB) (err error) {
	var (
		isPresent      bool
		actionExecutor actions.ActionExecutor
		inp            actions.Input
		output         actions.Output
		outputB        []byte
		nextStage      *Stage
	)
	log.Println("Executing Stage ", stage.Name)
	stage.ExecutionStartTime = time.Now().UTC()

	if inp, err = stage.GetInput(); err != nil {
		return
	}
	if actionExecutor, isPresent = StageMaps[stage.StageType]; !isPresent {
		err = errors.New(fmt.Sprintf("StageType %s not defined", stage.StageType))
		return
	}
	if output, err = actionExecutor.Execute(inp); err != nil {
		return
	}
	if outputB, err = json.Marshal(output); err != nil {
		return
	}

	stage.Output = StageOutputT(string(outputB))
	stage.ExecutionStopTime = time.Now().UTC()

	if ex := db.Save(stage); ex.Error != nil {
		err = ex.Error
		return
	}

	if nextStage, err = stage.Next(db); err != nil {
		return
	}

	if err = nextStage.Execute(db); err != nil {
		return
	}
	return
}

func (stage *Stage) Next(db *gorm.DB) (nextStage *Stage, err error) {
	var (
		condition   *Condition
		nextStageID uint
		input       actions.Input
	)
	condition = &Condition{}
	nextStage = &Stage{}
	input = make(actions.Input)

	if err = json.Unmarshal([]byte(stage.Condition), condition); err != nil {
		return
	}
	if err = json.Unmarshal([]byte(stage.Output), &input); err != nil {
		return
	}
	if nextStageID, err = condition.GetNextStageID(input); err != nil {
		return
	}
	if ex := db.Where("id = ?", nextStageID).First(nextStage); ex.Error != nil {
		err = ex.Error
		return
	}

	return
}
