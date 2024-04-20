package service

import (
	"testing"

	"github.com/cronny/actions"
)

func TestCondition_GetNextJobID(t *testing.T) {
	testCases := []struct {
		name        string
		condition   *Condition
		input       actions.Input
		expectedJob uint
		shouldErr   bool
	}{
		{
			name: "No rules match",
			condition: &Condition{
				Rules: []*ConditionRule{
					{
						Filters: []*Filter{
							{Name: "key1", Value: "value1", ComparisonType: EqualityComparison, ShouldMatch: true},
						},
					},
				},
			},
			input:     actions.Input{"key2": "value2"},
			shouldErr: true,
		},
		{
			name: "One rule matches",
			condition: &Condition{
				Rules: []*ConditionRule{
					{
						Filters: []*Filter{
							{Name: "key1", Value: "value1", ComparisonType: EqualityComparison, ShouldMatch: true},
						},
						JobID: 1,
					},
				},
			},
			input:       actions.Input{"key1": "value1"},
			expectedJob: 1,
		},
		{
			name: "Multiple rules, one matches",
			condition: &Condition{
				Rules: []*ConditionRule{
					{
						Filters: []*Filter{
							{Name: "key1", Value: "value1", ComparisonType: EqualityComparison, ShouldMatch: true},
						},
						JobID: 1,
					},
					{
						Filters: []*Filter{
							{Name: "key2", Value: "value2", ComparisonType: EqualityComparison, ShouldMatch: true},
						},
						JobID: 2,
					},
				},
			},
			input:       actions.Input{"key2": "value2"},
			expectedJob: 2,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			jobID, err := tc.condition.GetNextJobID(tc.input)
			if tc.shouldErr && err == nil {
				t.Errorf("Expected error, but got none")
			} else if !tc.shouldErr && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}

			if !tc.shouldErr && jobID != tc.expectedJob {
				t.Errorf("Expected job ID %d, but got %d", tc.expectedJob, jobID)
			}
		})
	}
}

func TestCondition_DoesInputMatch(t *testing.T) {
	testCases := []struct {
		name        string
		condition   Condition
		filters     []*Filter
		input       actions.Input
		expectedRes bool
	}{
		{
			name:        "No filters",
			condition:   Condition{},
			filters:     []*Filter{},
			input:       actions.Input{"key1": "value1"},
			expectedRes: true,
		},
		{
			name:      "One filter matches",
			condition: Condition{input: actions.Input{"key1": "value1"}},
			filters: []*Filter{
				{Name: "key1", Value: "value1", ComparisonType: EqualityComparison, ShouldMatch: true},
			},
			input:       actions.Input{"key1": "value1"},
			expectedRes: true,
		},
		{
			name:      "One filter doesn't match",
			condition: Condition{input: actions.Input{"key1": "value1"}},
			filters: []*Filter{
				{Name: "key1", Value: "value2", ComparisonType: EqualityComparison, ShouldMatch: true},
			},
			input:       actions.Input{"key1": "value1"},
			expectedRes: false,
		},
		{
			name:      "Multiple filters, one doesn't match",
			condition: Condition{input: actions.Input{"key1": "value1", "key2": "value2"}},
			filters: []*Filter{
				{Name: "key1", Value: "value1", ComparisonType: EqualityComparison, ShouldMatch: true},
				{Name: "key2", Value: "value3", ComparisonType: EqualityComparison, ShouldMatch: true},
			},
			input:       actions.Input{"key1": "value1", "key2": "value2"},
			expectedRes: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			res := tc.condition.DoesInputMatch(tc.filters)
			if res != tc.expectedRes {
				t.Errorf("Expected result %v, but got %v", tc.expectedRes, res)
			}
		})
	}
}

func TestFilter_Compare(t *testing.T) {
	testCases := []struct {
		name           string
		filter         *Filter
		input          actions.Input
		expectedErr    bool
		expectedErrMsg string
	}{
		{
			name:           "Key not present",
			filter:         &Filter{Name: "key1", Value: "value1", ComparisonType: EqualityComparison, ShouldMatch: true},
			input:          actions.Input{"key2": "value2"},
			expectedErr:    true,
			expectedErrMsg: "Filter Key key1 not present in input",
		},
		{
			name:        "Equality comparison match",
			filter:      &Filter{Name: "key1", Value: "value1", ComparisonType: EqualityComparison, ShouldMatch: true},
			input:       actions.Input{"key1": "value1"},
			expectedErr: false,
		},
		{
			name:           "Equality comparison not match",
			filter:         &Filter{Name: "key1", Value: "value1", ComparisonType: EqualityComparison, ShouldMatch: true},
			input:          actions.Input{"key1": "value2"},
			expectedErr:    true,
			expectedErrMsg: "Filter Value value1 doesn't match with input value2",
		},
		{
			name:        "Equality comparison match (ShouldMatch=false)",
			filter:      &Filter{Name: "key1", Value: "value1", ComparisonType: EqualityComparison, ShouldMatch: false},
			input:       actions.Input{"key1": "value2"},
			expectedErr: false,
		},
		{
			name:           "Equality comparison not match (ShouldMatch=false)",
			filter:         &Filter{Name: "key1", Value: "value1", ComparisonType: EqualityComparison, ShouldMatch: false},
			input:          actions.Input{"key1": "value1"},
			expectedErr:    true,
			expectedErrMsg: "Filter Value value1 matches with input value1",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.filter.Compare(tc.input)
			if tc.expectedErr && err == nil {
				t.Errorf("Expected error, but got none")
			} else if !tc.expectedErr && err != nil {
				t.Errorf("Unexpected error: %v", err)
			} else if tc.expectedErr && err.Error() != tc.expectedErrMsg {
				t.Errorf("Expected error message '%s', but got '%s'", tc.expectedErrMsg, err.Error())
			}
		})
	}
}
