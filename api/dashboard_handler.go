package api

import (
	"github.com/cronny/models"
	"github.com/gin-gonic/gin"
)

// DashboardStats represents the statistics shown on the dashboard
type DashboardStats struct {
	TotalJobs      int64 `json:"total_jobs"`
	TotalSchedules int64 `json:"total_schedules"`
	TotalActions   int64 `json:"total_actions"`
}

func (handler *Handler) DashboardStatsHandler(c *gin.Context) {
	var (
		jobCount      int64
		scheduleCount int64
		actionCount   int64
	)

	// Get counts for each type
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

	stats := DashboardStats{
		TotalJobs:      jobCount,
		TotalSchedules: scheduleCount,
		TotalActions:   actionCount,
	}

	c.JSON(200, gin.H{
		"stats":   stats,
		"message": "success",
	})
	return
}
