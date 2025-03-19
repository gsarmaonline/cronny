package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/cronny/models"
	"gorm.io/gorm"
)

var (
	SlackToken = os.Getenv("SLACK_TOKEN")
)

func createDefaultPlans(db *gorm.DB) error {
	// Create starter plan
	starterPlan := &models.Plan{
		Name:        "Starter",
		Type:        models.PlanTypeStarter,
		Price:       0.00,
		Description: "Basic plan for getting started",
	}
	if err := db.Save(starterPlan).Error; err != nil {
		return fmt.Errorf("failed to create starter plan: %v", err)
	}

	// Create pro plan
	proPlan := &models.Plan{
		Name:        "Pro",
		Type:        models.PlanTypePro,
		Price:       9.99,
		Description: "Professional plan with advanced features",
	}
	if err := db.Save(proPlan).Error; err != nil {
		return fmt.Errorf("failed to create pro plan: %v", err)
	}

	// Create enterprise plan
	enterprisePlan := &models.Plan{
		Name:        "Enterprise",
		Type:        models.PlanTypeEnterprise,
		Price:       49.99,
		Description: "Enterprise plan with full features",
	}
	if err := db.Save(enterprisePlan).Error; err != nil {
		return fmt.Errorf("failed to create enterprise plan: %v", err)
	}

	return nil
}

func createDefaultUser(db *gorm.DB) (*models.User, error) {
	// Get the starter plan ID
	var starterPlan models.Plan
	if err := db.Where("type = ?", models.PlanTypeStarter).First(&starterPlan).Error; err != nil {
		return nil, fmt.Errorf("failed to find starter plan: %v", err)
	}

	user := &models.User{
		Username: "admin",
		Email:    "admin@example.com",
		Password: "admin123", // This will be hashed by the BeforeSave hook
		PlanID:   starterPlan.ID,
	}
	if err := user.HashPassword(); err != nil {
		return nil, err
	}
	if err := db.Save(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

func getJobTemplate(userID uint) (jobTemplate *models.JobTemplate) {
	jobTemplate = &models.JobTemplate{
		Name: "http",
	}
	jobTemplate.SetUserID(userID)
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

func getAction(db *gorm.DB, userID uint) (action *models.Action) {
	action = &models.Action{
		Name: "http-action",
	}
	action.SetUserID(userID)
	db.Save(action)
	jobTemplate := getJobTemplate(userID)
	db.Save(jobTemplate)

	jobThree := &models.Job{
		Name:          "job-3",
		JobInputType:  models.StaticJsonInput,
		JobInputValue: fmt.Sprintf("{\"slack_api_token\": \"%s\", \"channel_id\": \"channel_1\", \"message\": \"hello from cronny\"}", SlackToken),
		ActionID:      action.ID,
		JobTemplateID: jobTemplate.ID,
	}
	jobThree.SetUserID(userID)
	db.Save(jobThree)

	jobTwo := &models.Job{
		Name:          "job-2",
		ActionID:      action.ID,
		JobTemplateID: jobTemplate.ID,
	}
	jobTwo.SetUserID(userID)
	db.Save(jobTwo)

	jobOne := &models.Job{
		Name:          "job-1",
		JobInputType:  models.StaticJsonInput,
		JobInputValue: "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/1\"}",
		Condition:     getConditionForJobOne(jobTwo.ID),
		IsRootJob:     true,
		ActionID:      action.ID,
		JobTemplateID: jobTemplate.ID,
	}
	jobOne.SetUserID(userID)
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

	// Create default plans first
	if err := createDefaultPlans(db); err != nil {
		fmt.Printf("Error creating default plans: %v\n", err)
		return
	}

	// Create default user
	user, err := createDefaultUser(db)
	if err != nil {
		fmt.Printf("Error creating default user: %v\n", err)
		return
	}

	action := getAction(db, user.ID)

	for idx := 0; idx < 10; idx++ {
		sched := &models.Schedule{
			Name:           fmt.Sprintf("sched-%d", idx),
			ScheduleType:   models.RelativeScheduleType,
			ScheduleValue:  "10",
			ScheduleUnit:   models.SecondScheduleUnit,
			EndsAt:         time.Now().UTC().Add(2 * time.Minute).Format(time.RFC3339),
			ScheduleStatus: models.PendingScheduleStatus,
			Action:         action,
		}
		sched.SetUserID(user.ID)
		db.Save(sched)
	}
}
