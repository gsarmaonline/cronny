package main

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/cronny/service"
	"gorm.io/gorm"
)

func getJobTemplate() (jobTemplate *service.JobTemplate) {
	jobTemplate = &service.JobTemplate{
		Name:     "http",
		ExecType: service.InternalExecType,
	}
	return
}

func getConditionForJobOne(jobId uint) (conditionS string) {
	condition := service.Condition{
		Rules: []*service.ConditionRule{
			&service.ConditionRule{
				JobID: jobId,
				Filters: []*service.Filter{
					&service.Filter{
						Name:           "userId",
						ComparisonType: service.EqualityComparison,
						ShouldMatch:    true,
						Value:          "1",
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
	jobTemplate := getJobTemplate()
	db.Save(jobTemplate)

	jobThree := &service.Job{
		Name:          "job-3",
		JobType:       "slack",
		JobInputType:  service.StaticJsonInput,
		JobInputValue: "{\"slack_api_token\": \"xoxb-6411969666804-7020910569552-v8882wCVsSy6gwqV4KeF1f1e\", \"channel_id\": \"C06VC3RAKNE\", \"message\": \"hello from cronny\"}",

		ActionID:      action.ID,
		JobTemplateID: jobTemplate.ID,
	}
	db.Save(jobThree)
	jobTwo := &service.Job{
		Name:          "job-2",
		JobType:       "logger",
		ActionID:      action.ID,
		JobTemplateID: jobTemplate.ID,
	}
	db.Save(jobTwo)
	jobOne := &service.Job{
		Name:          "job-1",
		JobType:       "http",
		JobInputType:  service.StaticJsonInput,
		JobInputValue: "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/1\"}",
		Condition:     getConditionForJobOne(jobTwo.ID),
		IsRootJob:     true,
		ActionID:      action.ID,
		JobTemplateID: jobTemplate.ID,
	}
	db.Save(jobOne)

	// Update jobTwo's input value with jobOne's ID
	jobTwo.JobInputType = service.JobInputAsTemplate
	jobTwo.JobInputValue = strconv.Itoa(int(jobOne.ID))
	jobTwo.JobInputValue = "{\"message\": \"hello from cronny: << job__job-1__output__title >> \"}"
	db.Save(jobTwo)
	return
}

func main() {
	db, _ := service.NewDb(nil)
	action := getAction(db)

	for idx := 0; idx < 1; idx++ {
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
