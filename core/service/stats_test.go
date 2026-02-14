package service

import (
	"testing"
)

func TestNewStatsCollector(t *testing.T) {
	sc, err := NewStatsCollector()
	if err != nil {
		t.Errorf("NewStatsCollector() error = %v", err)
		return
	}

	if sc == nil {
		t.Errorf("NewStatsCollector() returned nil")
	}
}

func TestStatsCollectorSetup(t *testing.T) {
	sc, err := NewStatsCollector()
	if err != nil {
		t.Errorf("NewStatsCollector() error = %v", err)
		return
	}

	if sc.Store["jobs_executed_count"] == nil {
		t.Error("Setup() failed to register jobs_executed_count")
	}

	if sc.Store["conditions_matched_count"] == nil {
		t.Error("Setup() failed to register conditions_matched_count")
	}

	if sc.Store["schedules_triggered_count"] == nil {
		t.Error("Setup() failed to register schedules_triggered_count")
	}
}

func TestStatsCollectorPrintStats(t *testing.T) {
	sc, err := NewStatsCollector()
	if err != nil {
		t.Errorf("NewStatsCollector() error = %v", err)
		return
	}

	JobsExecutedCount.Store(42)
	ConditionsMatchedCount.Store(24)
	SchedulesTriggeredCount.Store(12)

	err = sc.PrintStats()
	if err != nil {
		t.Errorf("PrintStats() error = %v", err)
		return
	}

	// Add assertions for printed output if needed
}
