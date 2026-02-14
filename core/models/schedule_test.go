package models

import (
	"testing"
	"time"
)

func TestGetRecurringExecutionTime(t *testing.T) {
	// Helper function to create a schedule with specific parameters
	createSchedule := func(interval string, unit string) *Schedule {
		return &Schedule{
			ScheduleType:  RecurringScheduleType,
			ScheduleValue: interval,
			ScheduleUnit:  unit,
		}
	}

	// Helper function to check if time is within expected range
	isWithinRange := func(actual, expected time.Time, tolerance time.Duration) bool {
		diff := actual.Sub(expected)
		return diff >= -tolerance && diff <= tolerance
	}

	tests := []struct {
		name           string
		schedule       *Schedule
		expectedOffset time.Duration
		tolerance      time.Duration
	}{
		{
			name:           "Every 5 seconds",
			schedule:       createSchedule("5", SecondScheduleUnit),
			expectedOffset: 5 * time.Second,
			tolerance:      time.Second,
		},
		{
			name:           "Every 2 minutes",
			schedule:       createSchedule("2", MinuteScheduleUnit),
			expectedOffset: 2 * time.Minute,
			tolerance:      time.Second,
		},
		{
			name:           "Every 3 hours",
			schedule:       createSchedule("3", HourScheduleUnit),
			expectedOffset: 3 * time.Hour,
			tolerance:      time.Minute,
		},
		{
			name:           "Every 1 day",
			schedule:       createSchedule("1", DayScheduleUnit),
			expectedOffset: 24 * time.Hour,
			tolerance:      time.Hour,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Get current time
			now := time.Now().UTC()

			// Get execution time
			execTime, err := tt.schedule.GetRecurringExecutionTime()
			if err != nil {
				t.Errorf("GetRecurringExecutionTime() error = %v", err)
				return
			}

			// Check if execution time is in the future
			if execTime.Before(now) {
				t.Errorf("GetRecurringExecutionTime() returned time in the past: %v", execTime)
			}

			// Check if execution time is within expected range
			expectedTime := now.Add(tt.expectedOffset)
			if !isWithinRange(execTime, expectedTime, tt.tolerance) {
				t.Errorf("GetRecurringExecutionTime() = %v, want within %v of %v", execTime, tt.tolerance, expectedTime)
			}

			// Test past time adjustment
			tt.schedule.ScheduleValue = "1" // Set to 1 unit for past time test
			execTime, err = tt.schedule.GetRecurringExecutionTime()
			if err != nil {
				t.Errorf("GetRecurringExecutionTime() error for past time = %v", err)
				return
			}

			// Check if past time was adjusted to future
			if execTime.Before(now) {
				t.Errorf("GetRecurringExecutionTime() for past time returned time in the past: %v", execTime)
			}
		})
	}
}

func TestGetExecutionTime(t *testing.T) {
	tests := []struct {
		name     string
		schedule *Schedule
		wantErr  bool
	}{
		{
			name: "Valid recurring schedule",
			schedule: &Schedule{
				ScheduleType:  RecurringScheduleType,
				ScheduleValue: "5",
				ScheduleUnit:  MinuteScheduleUnit,
			},
			wantErr: false,
		},
		{
			name: "Valid absolute schedule",
			schedule: &Schedule{
				ScheduleType:  AbsoluteScheduleType,
				ScheduleValue: time.Now().Add(1 * time.Hour).UTC().Format(time.RFC3339),
				ScheduleUnit:  MinuteScheduleUnit,
			},
			wantErr: false,
		},
		{
			name: "Valid relative schedule",
			schedule: &Schedule{
				ScheduleType:  RelativeScheduleType,
				ScheduleValue: "30",
				ScheduleUnit:  MinuteScheduleUnit,
			},
			wantErr: false,
		},
		{
			name: "Invalid schedule type",
			schedule: &Schedule{
				ScheduleType:  999, // Invalid type
				ScheduleValue: "5",
				ScheduleUnit:  MinuteScheduleUnit,
			},
			wantErr: true,
		},
		{
			name: "Invalid schedule value for recurring",
			schedule: &Schedule{
				ScheduleType:  RecurringScheduleType,
				ScheduleValue: "invalid",
				ScheduleUnit:  MinuteScheduleUnit,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			execTime, err := tt.schedule.GetExecutionTime()
			if (err != nil) != tt.wantErr {
				t.Errorf("GetExecutionTime() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && execTime.IsZero() {
				t.Error("GetExecutionTime() returned zero time for valid schedule")
			}
		})
	}
}

func TestValidateScheduleUnit(t *testing.T) {
	tests := []struct {
		name     string
		schedule *Schedule
		wantErr  bool
	}{
		{
			name: "Valid second unit",
			schedule: &Schedule{
				ScheduleUnit: SecondScheduleUnit,
			},
			wantErr: false,
		},
		{
			name: "Valid minute unit",
			schedule: &Schedule{
				ScheduleUnit: MinuteScheduleUnit,
			},
			wantErr: false,
		},
		{
			name: "Valid hour unit",
			schedule: &Schedule{
				ScheduleUnit: HourScheduleUnit,
			},
			wantErr: false,
		},
		{
			name: "Valid day unit",
			schedule: &Schedule{
				ScheduleUnit: DayScheduleUnit,
			},
			wantErr: false,
		},
		{
			name: "Invalid unit",
			schedule: &Schedule{
				ScheduleUnit: "invalid",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.schedule.validateScheduleUnit()
			if (err != nil) != tt.wantErr {
				t.Errorf("validateScheduleUnit() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
