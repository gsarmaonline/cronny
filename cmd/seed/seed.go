package main

import (
	"fmt"

	"github.com/cronny/service"
)

func main() {
	db, _ := service.NewDb(nil)
	action := &service.Action{
		Name: "http-action",
		Stages: []*service.Stage{
			&service.Stage{
				Name:      "http",
				StageType: "http",
			},
		},
	}
	db.Save(action)

	for idx := 0; idx < 10; idx++ {
		sched := &service.Schedule{
			Name: fmt.Sprintf("sched-%d", idx),

			ScheduleType:  service.RelativeScheduleType,
			ScheduleValue: "100",
			ScheduleUnit:  service.SecondScheduleUnit,

			ScheduleStatus: service.PendingScheduleStatus,

			Action: action,
		}
		db.Save(sched)
	}

}
