package main

import (
	"encoding/json"
	"fmt"

	"github.com/cronny/service"
	"gorm.io/gorm"
)

func getConditionForStageOne(stageId uint) (conditionS string) {
	condition := service.Condition{
		Rules: []*service.ConditionRule{
			&service.ConditionRule{
				StageID: stageId,
				Filters: []*service.Filter{
					&service.Filter{
						Name:           "id",
						ComparisonType: service.EqualityComparison,
						ShouldMatch:    true,
						Value:          "2",
					},
				},
			},
		},
	}
	conditionB, _ := json.Marshal(condition)
	conditionS = string(conditionB)
	return
}

func getAction(db *gorm.DB) (action *service.Action) {
	action = &service.Action{
		Name: "http-action",
	}
	db.Save(action)
	stageThree := &service.Stage{
		Name:            "stage-3",
		StageType:       "http",
		StageInputType:  service.StaticJsonInput,
		StageInputValue: "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/3\"}",
		ActionID:        action.ID,
	}
	db.Save(stageThree)
	stageTwo := &service.Stage{
		Name:            "stage-2",
		StageType:       "http",
		StageInputType:  service.StaticJsonInput,
		StageInputValue: "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/2\"}",
		ActionID:        action.ID,
	}
	db.Save(stageTwo)
	stageOne := &service.Stage{
		Name:            "stage-1",
		StageType:       "http",
		StageInputType:  service.StaticJsonInput,
		StageInputValue: "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/1\"}",
		Condition:       getConditionForStageOne(stageTwo.ID),
		IsRootStage:     true,
		ActionID:        action.ID,
	}
	db.Save(stageOne)
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
