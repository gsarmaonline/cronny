package main

import (
	"fmt"

	"github.com/cronny/service"
)

func main() {
	db, _ := service.NewDb(nil)
	for idx := 0; idx < 10; idx++ {
		sched := &service.Schedule{
			Name: fmt.Sprintf("sched-%d", idx),

			ScheduleType:  service.RelativeScheduleType,
			ScheduleValue: "100",
			ScheduleUnit:  service.SecondScheduleUnit,

			ScheduleStatus: service.PendingScheduleStatus,
		}
		db.Save(sched)
	}

}
