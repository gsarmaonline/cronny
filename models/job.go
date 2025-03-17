package models

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"gorm.io/gorm"

	"github.com/cronny/actions"
	"github.com/cronny/config"
)

const (
	// Job Inputs
	StaticJsonInput    = JobInputT("static_input")
	JobOutputAsInput   = JobInputT("job_output_as_input")
	JobInputAsTemplate = JobInputT("job_input_as_template")
)

var (
	JobMaps = map[string]actions.ActionExecutor{
		"http":   actions.HttpAction{},
		"logger": actions.LoggerAction{},
		"slack":  actions.SlackMessageAction{},
		"docker": actions.DockerAction{},
	}
)

type (
	Job struct {
		BaseModel

		Name    string `json:"name"`
		JobType string `json:"job_type"`

		InternalOutput JobOutputT `gorm:"-" json:"-"`

		JobInputType  JobInputT `json:"job_input_type"`
		JobInputValue string    `json:"job_input_value"`

		ActionID uint    `json:"action_id"`
		Action   *Action `json:"action"`

		JobTemplateID uint         `json:"job_template_id"`
		JobTemplate   *JobTemplate `json:"job_template"`

		Condition string `json:"condition"`
		IsRootJob bool   `json:"is_root_job"`

		ProceedCondition string `json:"proceed_condition"`

		// Job Configuration controls
		JobTimeoutInSecs int `json:"job_timeout_in_secs"`

		JobExecutions []*JobExecution `json:"job_executions"`

		User *User `json:"user"`
	}

	JobTemplate struct {
		BaseModel

		Name string `json:"job_template"`

		ExecType ExecTypeT `json:"exec_type"`
		ExecLink string    `json:"exec_link"`

		Code string `json:"code"`

		Jobs []*Job `json:"jobs"`

		User *User `json:"user"`
	}

	JobExecution struct {
		BaseModel

		JobID uint `json:"job_id"`
		Job   *Job `json:"job"`

		Output JobOutputT `json:"output"`

		ExecutionStartTime time.Time `json:"execution_start_time" gorm:"type:TIMESTAMP;null;default:null"`
		ExecutionStopTime  time.Time `json:"execution_stop_time" gorm:"type:TIMESTAMP;null;default:null"`

		User *User `json:"user"`
	}
)

// ==========================================================
// Job

func (job *Job) setDefaultValues() (err error) {
	if job.JobTimeoutInSecs == 0 {
		job.JobTimeoutInSecs = config.DefaultJobTimeoutInSecs
	}
	return
}

func (job *Job) BeforeSave(db *gorm.DB) (err error) {
	if err = job.setDefaultValues(); err != nil {
		return
	}
	return
}

func (job *Job) GetLatestJobExecution(db *gorm.DB) (jobExecution *JobExecution, err error) {
	jobExecution = &JobExecution{}
	if ex := db.Where("job_id = ?", job.ID).Order("execution_stop_time desc").Limit(1).First(jobExecution); ex.Error != nil {
		err = ex.Error
		return
	}
	return
}

func (job *Job) GetInput(db *gorm.DB) (input actions.Input, err error) {
	input = make(actions.Input)

	switch job.JobInputType {
	case StaticJsonInput:
		if err = json.Unmarshal([]byte(job.JobInputValue), &input); err != nil {
			return
		}
	case JobOutputAsInput:
		var (
			prevJobOutputId  int
			prevJob          *Job
			prevJobExecution *JobExecution
		)
		if prevJobOutputId, err = strconv.Atoi(job.JobInputValue); err != nil {
			err = fmt.Errorf("[GetInput] Failed to convert the job ID to int %s - %s", job.JobInputValue, err)
			return
		}
		prevJob = &Job{}
		if ex := db.Where("id = ?", prevJobOutputId).First(prevJob); ex.Error != nil {
			err = ex.Error
			err = fmt.Errorf("[GetInput] Failed to get the previous Job from ID %d - %s", prevJobOutputId, err)
			return
		}
		if prevJobExecution, err = prevJob.GetLatestJobExecution(db); err != nil {
			err = fmt.Errorf("[GetInput] Failed to get the latest job execution from ID %d - %s", prevJobOutputId, err)
			return
		}
		if err = json.Unmarshal([]byte(prevJobExecution.Output), &input); err != nil {
			err = fmt.Errorf("[GetInput] Failed to Unmarshal previous job's output %s - %s", string(prevJobExecution.Output), err)
			return
		}
	case JobInputAsTemplate:
		var (
			jobInpTemplate *JobInputTemplate
			parsedTemplate string
		)
		if jobInpTemplate, err = NewJobInputTemplate(db, job, job.JobInputValue); err != nil {
			return
		}
		if parsedTemplate, err = jobInpTemplate.Parse(); err != nil {
			return
		}
		if err = json.Unmarshal([]byte(parsedTemplate), &input); err != nil {
			log.Println(parsedTemplate, err)
			return
		}
	default:
		err = fmt.Errorf("No JobInputType matched for %s", job.JobInputType)
		return
	}
	return
}

func (job *Job) CreateJobExecution(db *gorm.DB, startTime, stopTime time.Time, output JobOutputT) (err error) {
	jobExecution := &JobExecution{
		JobID:              job.ID,
		ExecutionStartTime: startTime,
		ExecutionStopTime:  stopTime,
		Output:             output,
	}
	if ex := db.Save(jobExecution); ex.Error != nil {
		err = ex.Error
		return
	}
	return
}

func (job *Job) ExecuteJobTemplate(db *gorm.DB) (output JobOutputT, err error) {
	var (
		isPresent      bool
		actionExecutor actions.ActionExecutor
		inp            actions.Input
		outputMap      actions.Output
		outputB        []byte
		baseAction     actions.BaseAction
	)
	if inp, err = job.GetInput(db); err != nil {
		return
	}
	if actionExecutor, isPresent = JobMaps[job.JobType]; !isPresent {
		err = errors.New(fmt.Sprintf("JobType %s not defined", job.JobType))
		return
	}
	if outputMap, err = baseAction.Execute(actionExecutor, inp); err != nil {
		return
	}
	if outputB, err = json.Marshal(outputMap); err != nil {
		return
	}
	output = JobOutputT(string(outputB))
	return
}

func (job *Job) Execute(db *gorm.DB) (err error) {
	var (
		nextJob *Job
		output  JobOutputT

		startTime, stopTime time.Time
	)
	log.Println("Executing Job", job.Name, "with ID", job.ID)

	startTime = time.Now().UTC()
	if output, err = job.ExecuteJobTemplate(db); err != nil {
		return
	}
	stopTime = time.Now().UTC()

	if err = job.CreateJobExecution(db, startTime, stopTime, output); err != nil {
		return
	}

	job.InternalOutput = output
	if nextJob, err = job.Next(db); err != nil {
		return
	}

	if err = nextJob.Execute(db); err != nil {
		return
	}
	return
}

func (job *Job) Next(db *gorm.DB) (nextJob *Job, err error) {
	var (
		condition     *Condition
		nextJobID     uint
		prevJobOutput actions.Output
	)
	condition = &Condition{}
	nextJob = &Job{}
	prevJobOutput = make(actions.Output)

	if err = json.Unmarshal([]byte(job.Condition), condition); err != nil {
		err = fmt.Errorf("[Next] Failed to unmarshal condition for %s - %s", job.Condition, err)
		return
	}
	if err = json.Unmarshal([]byte(job.InternalOutput), &prevJobOutput); err != nil {
		err = fmt.Errorf("[Next] Failed to unmarshal prevJobOutput for %s - %s", job.InternalOutput, err)
		return
	}
	// The previous job's output is used to decide the next job
	// in the workflow/pipeline depending on the condition provided
	if nextJobID, err = condition.GetNextJobID(actions.Input(prevJobOutput)); err != nil {
		err = fmt.Errorf("[Next] Failed to get next job ID from condition %s - %s", actions.Input(prevJobOutput), err)
		return
	}
	if ex := db.Where("id = ?", nextJobID).First(nextJob); ex.Error != nil {
		err = ex.Error
		err = fmt.Errorf("[Next] Failed to get next job %d - %s", nextJobID, err)
		return
	}

	return
}
