package models

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"gorm.io/gorm"

	"github.com/cronny/core/actions"
	"github.com/cronny/core/config"
)

const (
	// Job Inputs
	StaticJsonInput    = JobInputT("static_input")
	JobOutputAsInput   = JobInputT("job_output_as_input")
	JobInputAsTemplate = JobInputT("job_input_as_template")
)

var (
	JobMaps = map[string]actions.ActionExecutor{
		"http":            actions.HttpAction{},
		"logger":          actions.LoggerAction{},
		"slack":           actions.SlackMessageAction{},
		"docker-registry": actions.DockerRegistryAction{},
	}
)

type (
	Job struct {
		BaseModel

		Name string `json:"name"`

		InternalOutput JobOutputT `gorm:"-" json:"-"`

		JobInputType  JobInputT `json:"job_input_type"`
		JobInputValue string    `json:"job_input_value"`

		ActionID uint    `json:"action_id"`
		Action   *Action `json:"action"`

		JobTemplateID uint         `json:"job_template_id"`
		JobTemplate   *JobTemplate `json:"job_template"`

		Condition string `json:"condition"`
		IsRootJob bool   `json:"is_root_job"`

		// Job Configuration controls
		JobTimeoutInSecs int `json:"job_timeout_in_secs"`

		JobExecutions []*JobExecution `json:"job_executions"`

		User *User `json:"user"`
	}

	JobTemplate struct {
		BaseModel

		Name string `json:"name"`
		User *User  `json:"user"`
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

func (job *Job) validateAssociations() (err error) {
	if job.Action == nil && job.ActionID == 0 {
		err = fmt.Errorf("Action is nil for job %s", job.Name)
		return
	}
	if job.JobTemplate == nil && job.JobTemplateID == 0 {
		err = fmt.Errorf("JobTemplate is nil for job %s", job.Name)
		return
	}
	return
}

func (job *Job) BeforeSave(db *gorm.DB) (err error) {
	if err = job.setDefaultValues(); err != nil {
		return
	}
	if err = job.validateAssociations(); err != nil {
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
			err = fmt.Errorf("[GetInput] failed to convert job ID to int %s: %w", job.JobInputValue, err)
			return
		}
		prevJob = &Job{}
		if ex := db.Where("id = ?", prevJobOutputId).First(prevJob); ex.Error != nil {
			err = fmt.Errorf("[GetInput] failed to get previous job with ID %d: %w", prevJobOutputId, ex.Error)
			return
		}
		if prevJobExecution, err = prevJob.GetLatestJobExecution(db); err != nil {
			err = fmt.Errorf("[GetInput] failed to get latest job execution for ID %d: %w", prevJobOutputId, err)
			return
		}
		if err = json.Unmarshal([]byte(prevJobExecution.Output), &input); err != nil {
			err = fmt.Errorf("[GetInput] failed to unmarshal previous job output: %w", err)
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
		jobTemplate    *JobTemplate
	)
	if inp, err = job.GetInput(db); err != nil {
		return
	}

	// Get job template
	jobTemplate = &JobTemplate{}
	if ex := db.Where("id = ?", job.JobTemplateID).First(jobTemplate); ex.Error != nil {
		err = ex.Error
		return
	}

	if actionExecutor, isPresent = JobMaps[jobTemplate.Name]; !isPresent {
		err = errors.New(fmt.Sprintf("JobTemplate %s not defined", jobTemplate.Name))
		return
	}

	// Execute with timeout enforcement
	type result struct {
		output actions.Output
		err    error
	}
	resultCh := make(chan result, 1)
	timeout := time.Duration(job.JobTimeoutInSecs) * time.Second

	go func() {
		out, execErr := baseAction.Execute(actionExecutor, inp)
		resultCh <- result{output: out, err: execErr}
	}()

	select {
	case res := <-resultCh:
		if res.err != nil {
			return "", res.err
		}
		outputMap = res.output
	case <-time.After(timeout):
		return "", fmt.Errorf("job execution timed out after %d seconds", job.JobTimeoutInSecs)
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
		return fmt.Errorf("failed to execute job %s (ID: %d): %w", job.Name, job.ID, err)
	}
	stopTime = time.Now().UTC()

	if err = job.CreateJobExecution(db, startTime, stopTime, output); err != nil {
		return fmt.Errorf("failed to create job execution for job %s (ID: %d): %w", job.Name, job.ID, err)
	}

	job.InternalOutput = output
	if nextJob, err = job.Next(db); err != nil {
		return fmt.Errorf("failed to get next job for job %s (ID: %d): %w", job.Name, job.ID, err)
	}

	if err = nextJob.Execute(db); err != nil {
		return fmt.Errorf("failed to execute next job from %s (ID: %d): %w", job.Name, job.ID, err)
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
		err = fmt.Errorf("[Next] failed to unmarshal condition: %w", err)
		return
	}
	if err = json.Unmarshal([]byte(job.InternalOutput), &prevJobOutput); err != nil {
		err = fmt.Errorf("[Next] failed to unmarshal job output: %w", err)
		return
	}
	// The previous job's output is used to decide the next job
	// in the workflow/pipeline depending on the condition provided
	if nextJobID, err = condition.GetNextJobID(actions.Input(prevJobOutput)); err != nil {
		err = fmt.Errorf("[Next] failed to get next job ID: %w", err)
		return
	}
	if ex := db.Where("id = ?", nextJobID).First(nextJob); ex.Error != nil {
		err = fmt.Errorf("[Next] failed to get next job with ID %d: %w", nextJobID, ex.Error)
		return
	}

	return
}
