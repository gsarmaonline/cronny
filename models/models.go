package models

import (
	"time"
)

type (
	ScheduleTypeT  int
	TriggerStatusT int

	StageTypeT   string
	StageOutputT string

	Schedule struct {
		Name          string        `json:"name"`
		ScheduleType  ScheduleTypeT `json:"schedule_type"`
		ScheduleValue string        `json:"schedule_value"`
		Action        *Action       `json:"action"`
	}

	Trigger struct {
		Schedule *Schedule `json:"schedule"`
		StartAt  time.Time `json:"start_at"`
	}

	Action struct {
		Name   string   `json:"name"`
		Stages []*Stage `json:"stages"`
	}

	Stage struct {
		Name      string       `json:"name"`
		StageType StageTypeT   `json:"stage_type"`
		Output    StageOutputT `json:"output"`
	}
)
