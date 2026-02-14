package api

import (
	"time"

	"github.com/cronny/core/models"
	"github.com/gin-gonic/gin"
)

// JobTypeStats represents statistics for different job types
type JobTypeStats struct {
	HTTPJobs  int64 `json:"http_jobs"`
	SlackJobs int64 `json:"slack_jobs"`
	OtherJobs int64 `json:"other_jobs"`
}

// ScheduleStatusStats represents statistics for different schedule statuses
type ScheduleStatusStats struct {
	Active   int64 `json:"active"`
	Inactive int64 `json:"inactive"`
}

// RecentActivity represents recent job executions and schedule runs
type RecentActivity struct {
	ID            uint      `json:"id"`
	Type          string    `json:"type"` // "job" or "schedule"
	Name          string    `json:"name"`
	ExecutionTime time.Time `json:"execution_time"`
	Status        string    `json:"status"`
}

// DashboardStats represents the statistics shown on the dashboard
type DashboardStats struct {
	TotalJobs      int64               `json:"total_jobs"`
	TotalSchedules int64               `json:"total_schedules"`
	TotalActions   int64               `json:"total_actions"`
	JobTypes       JobTypeStats        `json:"job_types"`
	ScheduleStatus ScheduleStatusStats `json:"schedule_status"`
	RecentActivity []RecentActivity    `json:"recent_activity"`
}

func (handler *Handler) DashboardStatsHandler(c *gin.Context) {
	var (
		jobCount       int64
		scheduleCount  int64
		actionCount    int64
		jobTypes       JobTypeStats
		scheduleStats  ScheduleStatusStats
		recentActivity []RecentActivity
	)

	// Get total counts
	if err := handler.db.Model(&models.Job{}).Count(&jobCount).Error; err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to fetch job count",
		})
		return
	}

	if err := handler.db.Model(&models.Schedule{}).Count(&scheduleCount).Error; err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to fetch schedule count",
		})
		return
	}

	if err := handler.db.Model(&models.Action{}).Count(&actionCount).Error; err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to fetch action count",
		})
		return
	}

	// Get job type statistics
	if err := handler.db.Model(&models.Job{}).Where("job_type = ?", "http").Count(&jobTypes.HTTPJobs).Error; err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to fetch HTTP job count",
		})
		return
	}

	if err := handler.db.Model(&models.Job{}).Where("job_type = ?", "slack").Count(&jobTypes.SlackJobs).Error; err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to fetch Slack job count",
		})
		return
	}

	jobTypes.OtherJobs = jobCount - jobTypes.HTTPJobs - jobTypes.SlackJobs

	// Get schedule status statistics
	if err := handler.db.Model(&models.Schedule{}).Where("schedule_status = ?", models.PendingScheduleStatus).Count(&scheduleStats.Active).Error; err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to fetch active schedule count",
		})
		return
	}

	scheduleStats.Inactive = scheduleCount - scheduleStats.Active

	// Get recent activity (last 10 job executions and schedule runs)
	var recentJobExecutions []models.JobExecution
	if err := handler.db.Order("execution_start_time desc").Limit(5).Find(&recentJobExecutions).Error; err != nil {
		c.JSON(500, gin.H{
			"message": "Failed to fetch recent job executions",
		})
		return
	}

	// Convert job executions to recent activity
	for _, exec := range recentJobExecutions {
		var job models.Job
		if err := handler.db.First(&job, exec.JobID).Error; err != nil {
			continue
		}
		recentActivity = append(recentActivity, RecentActivity{
			ID:            exec.ID,
			Type:          "job",
			Name:          job.Name,
			ExecutionTime: exec.ExecutionStartTime,
			Status:        "completed", // You might want to add a status field to JobExecution
		})
	}

	// Add recent schedule runs (if you have a ScheduleExecution model)
	// This is a placeholder for when you implement schedule execution tracking
	// var recentScheduleExecutions []models.ScheduleExecution
	// if err := handler.db.Order("execution_time desc").Limit(5).Find(&recentScheduleExecutions).Error; err != nil {
	//     c.JSON(500, gin.H{
	//         "message": "Failed to fetch recent schedule executions",
	//     })
	//     return
	// }

	stats := DashboardStats{
		TotalJobs:      jobCount,
		TotalSchedules: scheduleCount,
		TotalActions:   actionCount,
		JobTypes:       jobTypes,
		ScheduleStatus: scheduleStats,
		RecentActivity: recentActivity,
	}

	c.JSON(200, gin.H{
		"stats":   stats,
		"message": "success",
	})
	return
}
