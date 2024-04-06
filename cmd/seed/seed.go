package main

import (
	"fmt"

	"github.com/cronny/service"
	"gorm.io/gorm"
)

func getAction(db *gorm.DB) (action *service.Action) {
	action = &service.Action{
		Name: "http-action",
		Stages: []*service.Stage{
			&service.Stage{
				Name:            "stage-1",
				StageType:       "http",
				StageInputType:  service.StaticJsonInput,
				StageInputValue: "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/1\"}",
			},
		},
	}
	db.Save(action)
	return
}

func main() {
	db, _ := service.NewDb(nil)
	action := getAction(db)

	for idx := 0; idx < 10; idx++ {
		sched := &service.Schedule{
			Name: fmt.Sprintf("sched-%d", idx),

			ScheduleType:  service.RelativeScheduleType,
			ScheduleValue: "10",
			ScheduleUnit:  service.SecondScheduleUnit,

			ScheduleStatus: service.PendingScheduleStatus,

			Action: action,
		}
		db.Save(sched)
	}

}
