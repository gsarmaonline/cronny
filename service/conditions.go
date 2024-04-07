package service

import (
	"fmt"
	"log"

	"github.com/cronny/actions"
)

const (
	EqualityComparison = ComparisonT("equality")
	GreaterThan        = ComparisonT("greater_than")
	LesserThan         = ComparisonT("lesser_than")
)

type (
	ComparisonT string

	Condition struct {
		Version uint32           `json:"version"`
		input   actions.Input    `json:"-"`
		Rules   []*ConditionRule `json:"condition_rules"`
	}

	ConditionRule struct {
		// If no filters are set, it becomes a wildcard rule.
		// ie. no conditions will be checked before proceeding
		// to the next stage
		Filters []*Filter `json:"filters"`
		StageID uint      `json:"stage_id"`
	}
	Filter struct {
		Name           string      `json:"name"`
		ShouldMatch    bool        `json:"should_match"`
		ComparisonType ComparisonT `json:"comparison_type"`
		Value          string      `json:"value"`
	}
)

func (condition *Condition) GetNextStageID(input actions.Input) (stageId uint, err error) {
	condition.input = input
	for _, rule := range condition.Rules {
		if inputMatches := condition.DoesInputMatch(rule.Filters); !inputMatches {
			continue
		}
		stageId = rule.StageID
		return
	}
	err = fmt.Errorf("No stage found for input %v", input)
	return
}

func (condition *Condition) DoesInputMatch(filters []*Filter) (matches bool) {
	matches = false
	for _, filter := range filters {
		if err := filter.Compare(condition.input); err != nil {
			log.Println(err)
			return
		}
	}
	matches = true
	return
}

func (filter *Filter) Compare(input actions.Input) (err error) {
	var (
		inpVal    string
		isPresent bool
	)
	if inpVal, isPresent = input[filter.Name]; !isPresent {
		err = fmt.Errorf("Filter Key %s not present in input", filter.Name, input)
		return
	}
	switch filter.ComparisonType {
	case EqualityComparison:
		switch filter.ShouldMatch {
		case true:
			if inpVal != filter.Value {
				err = fmt.Errorf("Filter Value %s doesn't match with input %s", filter.Value, inpVal)
				return
			}
		case false:
			if inpVal == filter.Value {
				err = fmt.Errorf("Filter Value %s matches with input %s", filter.Value, inpVal)
				return
			}
		}
	default:
		err = fmt.Errorf("No matching comparison type found for filter with type %s", filter.ComparisonType)
		return
	}
	return
}
