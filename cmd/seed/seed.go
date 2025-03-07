package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/cronny/models"
	"gorm.io/gorm"
)

func getJobTemplate() (jobTemplate *models.JobTemplate) {
	jobTemplate = &models.JobTemplate{
		Name:     "http",
		ExecType: models.InternalExecType,
	}
	return
}

func getConditionForJobOne(jobId uint) (conditionS string) {
	condition := models.Condition{
		Rules: []*models.ConditionRule{
			&models.ConditionRule{
				JobID: jobId,
				Filters: []*models.Filter{
					&models.Filter{
						Name:           "userId",
						ComparisonType: models.EqualityComparison,
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

func getAction(db *gorm.DB) (action *models.Action) {
	action = &models.Action{
		Name: "http-action",
	}
	db.Save(action)
	jobTemplate := getJobTemplate()
	db.Save(jobTemplate)

	jobThree := &models.Job{
		Name:          "job-3",
		JobType:       "slack",
		JobInputType:  models.StaticJsonInput,
		JobInputValue: "{\"slack_api_token\": \"xoxb-6411969666804-7020910569552-v8882wCVsSy6gwqV4KeF1f1e\", \"channel_id\": \"C06VC3RAKNE\", \"message\": \"hello from cronny\"}",

		ActionID:      action.ID,
		JobTemplateID: jobTemplate.ID,
	}
	db.Save(jobThree)
	jobTwo := &models.Job{
		Name:          "job-2",
		JobType:       "logger",
		ActionID:      action.ID,
		JobTemplateID: jobTemplate.ID,
	}
	db.Save(jobTwo)
	jobOne := &models.Job{
		Name:          "job-1",
		JobType:       "http",
		JobInputType:  models.StaticJsonInput,
		JobInputValue: "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/1\"}",
		Condition:     getConditionForJobOne(jobTwo.ID),
		IsRootJob:     true,
		ActionID:      action.ID,
		JobTemplateID: jobTemplate.ID,
	}
	db.Save(jobOne)

	// Update jobTwo's input value with jobOne's ID
	jobTwo.JobInputType = models.JobInputAsTemplate
	jobTwo.JobInputValue = strconv.Itoa(int(jobOne.ID))
	jobTwo.JobInputValue = "{\"message\": \"hello from cronny: << job__job-1__output__title >> \"}"
	db.Save(jobTwo)
	return
}

func main() {
	db, _ := models.NewDb(nil)
	action := getAction(db)

	for idx := 0; idx < 10; idx++ {
		sched := &models.Schedule{
			Name: fmt.Sprintf("sched-%d", idx),

			ScheduleType:  models.RelativeScheduleType,
			ScheduleValue: "10",
			ScheduleUnit:  models.SecondScheduleUnit,

			EndsAt: time.Now().UTC().Add(2 * time.Minute).Format(time.RFC3339),

			ScheduleStatus: models.PendingScheduleStatus,

			Action: action,
		}
		db.Save(sched)
	}

}
