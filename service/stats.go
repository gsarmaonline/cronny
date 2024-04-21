package service

import (
	"log"
	"sync/atomic"
	"time"
)

var (
	// Any element added here should also be added to the
	// Setup() method. The Setup method registering is required
	// so that the Collector service can periodically flush the
	// data to an output
	JobsExecutedCount       atomic.Uint32
	ConditionsMatchedCount  atomic.Uint32
	SchedulesTriggeredCount atomic.Uint32
)

type (
	StatsCollector struct {
		Store map[string]*atomic.Uint32
	}
)

func NewStatsCollector() (sc *StatsCollector, err error) {
	sc = &StatsCollector{
		Store: make(map[string]*atomic.Uint32, 1024),
	}
	if err = sc.Setup(); err != nil {
		return
	}
	return
}

func (sc *StatsCollector) Setup() (err error) {
	sc.Store["jobs_executed_count"] = &JobsExecutedCount
	sc.Store["conditions_matched_count"] = &ConditionsMatchedCount
	sc.Store["schedules_triggered_count"] = &SchedulesTriggeredCount
	return
}

func (sc *StatsCollector) PrintStats() (err error) {
	log.Println("------------------------------ Printing registered stats ------------------------------")
	for statName, statVal := range sc.Store {
		log.Println(statName, statVal.Load())
	}
	log.Println("------------------------------ End ------------------------------")
	return
}

func (sc *StatsCollector) Run() (err error) {
	for {
		time.Sleep(10 * time.Second)
		if err = sc.PrintStats(); err != nil {
			log.Println(err)
		}
	}
	return
}
