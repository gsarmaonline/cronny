package models

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/cronny/core/actions"
	"gorm.io/gorm"
)

const (
	KeywordDelimiter = "__"
)

type (
	JobInputTemplate struct {
		SearchPool string `json:"search_pool"`
		Job        *Job   `json:"-"`

		db                *gorm.DB `json:"-"`
		Result            string   `json:"-"`
		lastModifiedIndex int      `json:"-"`
	}
)

func NewJobInputTemplate(db *gorm.DB, job *Job, searchPool string) (inpTemplate *JobInputTemplate, err error) {
	inpTemplate = &JobInputTemplate{
		SearchPool: searchPool,
		Job:        job,
		db:         db,
	}
	return
}

func (inpTemplate *JobInputTemplate) findMatchingIndexes() (matches [][]int, err error) {
	re := regexp.MustCompile(`<<([^>]+)>>`)
	matches = re.FindAllStringSubmatchIndex(inpTemplate.SearchPool, -1)
	return
}

// Matched str would be of format "job__baw sbe__output__name"
// This refers to an element of type Job with name "baw sbe" and finding the "name"
// attribute of the output
func (inpTemplate *JobInputTemplate) validateElem(matchedStr string) (err error) {
	matchedSp := strings.Split(matchedStr, KeywordDelimiter)
	if len(matchedSp) < 3 {
		err = fmt.Errorf("Not enough elements for matched string %s", matchedStr)
		return
	}
	if matchedSp[0] != "job" {
		err = fmt.Errorf("Prefix keyword doesn't match %s", matchedStr)
		return
	}
	if matchedSp[2] != "output" {
		err = fmt.Errorf("Output keyword doesn't match %s", matchedStr)
		return
	}
	return
}

func (inpTemplate *JobInputTemplate) findElem(matchedElem []int) (elemStr string, err error) {
	var (
		latestJobExec *JobExecution
		jobOutput     actions.Output
	)
	jobOutput = make(actions.Output)
	matchedStr := inpTemplate.SearchPool[matchedElem[2]+1 : matchedElem[3]-1]
	if inpTemplate.validateElem(matchedStr); err != nil {
		return
	}
	matchedSp := strings.Split(matchedStr, KeywordDelimiter)
	referredJob := &Job{}

	if ex := inpTemplate.db.Where("action_id = ? AND name = ?",
		inpTemplate.Job.ActionID, matchedSp[1]).First(referredJob); ex.Error != nil {
		err = ex.Error
		return
	}
	if latestJobExec, err = referredJob.GetLatestJobExecution(inpTemplate.db); err != nil {
		return
	}
	if err = json.Unmarshal([]byte(string(latestJobExec.Output)), &jobOutput); err != nil {
		return
	}
	elemStr = jobOutput[strings.TrimSpace(matchedSp[3])].(string)
	return
}

func (inpTemplate *JobInputTemplate) replaceStrWithElem(matchedElem []int, toReplaceWith string) (err error) {
	inpTemplate.Result += inpTemplate.SearchPool[inpTemplate.lastModifiedIndex:(matchedElem[0])] + toReplaceWith
	inpTemplate.lastModifiedIndex = matchedElem[1]
	return
}

func (inpTemplate *JobInputTemplate) Parse() (parsedTemplate string, err error) {
	var (
		matches [][]int
	)
	if matches, err = inpTemplate.findMatchingIndexes(); err != nil {
		return
	}
	for _, matchedElem := range matches {
		var (
			toReplaceWith string
		)
		if toReplaceWith, err = inpTemplate.findElem(matchedElem); err != nil {
			return
		}
		if err = inpTemplate.replaceStrWithElem(matchedElem, toReplaceWith); err != nil {
			return
		}
	}
	inpTemplate.Result += inpTemplate.SearchPool[inpTemplate.lastModifiedIndex:(len(inpTemplate.SearchPool))]
	parsedTemplate = inpTemplate.Result
	return
}
