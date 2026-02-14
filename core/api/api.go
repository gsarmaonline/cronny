package api

import (
	"fmt"
	"log"
	"os"

	"github.com/cronny/core/models"
	"github.com/cronny/core/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	cronnyConfig "github.com/cronny/core/config"
)

type (
	ApiServer struct {
		config *ApiServerConfig

		engine *gin.Engine
		db     *gorm.DB

		handler *Handler
	}

	ApiServerConfig struct {
		Host string `json:"host"`
		Port string `json:"port"`
	}
)

func DefaultApiServerConfig() (config *ApiServerConfig) {
	bindHost := "0.0.0.0"
	if os.Getenv(cronnyConfig.CronnyEnvVar) == cronnyConfig.DevelopmentEnv {
		bindHost = "127.0.0.1"
	}
	config = &ApiServerConfig{
		Host: bindHost,
		Port: "8009",
	}
	return
}
func NewServer(config *ApiServerConfig) (apiServer *ApiServer, err error) {
	if config == nil {
		config = DefaultApiServerConfig()
	}
	apiServer = &ApiServer{
		config: config,
		engine: gin.Default(),
	}
	if apiServer.db, err = models.NewDb(nil); err != nil {
		log.Println("DB not set")
	}
	if apiServer.handler, err = NewHandler(apiServer.db); err != nil {
		return
	}
	if err = apiServer.Setup(); err != nil {
		return
	}
	return
}

func (apiServer *ApiServer) Setup() (err error) {
	// Add CORS middleware
	apiServer.engine.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	cronnyApiPrefix := "/api/cronny/v1"
	apiServer.engine.GET("/", apiServer.handler.rootHandler)

	// Authentication routes - public
	auth := apiServer.engine.Group(cronnyApiPrefix)
	{
		auth.POST("/auth/login", UserLoginHandler(apiServer.db))
		auth.POST("/auth/register", UserRegisterHandler(apiServer.db))
		auth.POST("/auth/google", GoogleLoginHandler(apiServer.db))
	}

	// Protected routes
	authorized := apiServer.engine.Group(cronnyApiPrefix)
	authorized.Use(AuthMiddleware())
	authorized.Use(UserScopeMiddleware(apiServer.db))
	{
		// User routes
		authorized.GET("/auth/me", UserMeHandler(apiServer.db))
		authorized.GET("/user/profile", apiServer.handler.GetUserProfileHandler)
		authorized.PUT("/user/profile", apiServer.handler.UpdateUserProfileHandler)
		authorized.PUT("/user/plan", apiServer.handler.UpdateUserPlanHandler)
		authorized.GET("/user/plans", apiServer.handler.GetAvailablePlansHandler)

		// Dashboard stats
		authorized.GET("/dashboard/stats", apiServer.handler.DashboardStatsHandler)

		// Schedules
		authorized.GET("/schedules", apiServer.handler.ScheduleIndexHandler)
		authorized.GET("/schedules/:id", apiServer.handler.ScheduleShowHandler)
		authorized.POST("/schedules", apiServer.handler.ScheduleCreateHandler)
		authorized.PUT("/schedules/:id", apiServer.handler.ScheduleUpdateHandler)
		authorized.DELETE("/schedules/:id", apiServer.handler.ScheduleDeleteHandler)

		// Actions
		authorized.GET("/actions", apiServer.handler.ActionIndexHandler)
		authorized.GET("/actions/:id", apiServer.handler.ActionShowHandler)
		authorized.POST("/actions", apiServer.handler.ActionCreateHandler)
		authorized.PUT("/actions/:id", apiServer.handler.ActionUpdateHandler)
		authorized.DELETE("/actions/:id", apiServer.handler.ActionDeleteHandler)

		// Jobs
		authorized.GET("/jobs", apiServer.handler.JobIndexHandler)
		authorized.GET("/jobs/:id", apiServer.handler.JobShowHandler)
		authorized.POST("/jobs", apiServer.handler.JobCreateHandler)
		authorized.PUT("/jobs/:id", apiServer.handler.JobUpdateHandler)
		authorized.DELETE("/jobs/:id", apiServer.handler.JobDeleteHandler)

		// Job Templates
		authorized.GET("/job_templates", apiServer.handler.JobTemplateIndexHandler)
	}

	return
}

func (apiServer *ApiServer) runCleanerJobs() (err error) {
	var (
		execCleaner *service.JobExecutionCleaner
	)
	if execCleaner, err = service.NewJobExecutionCleaner(apiServer.db); err != nil {
		return
	}
	go execCleaner.Run()
	return
}

func (apiServer *ApiServer) Run() (err error) {
	if err = apiServer.runCleanerJobs(); err != nil {
		return
	}
	if err = apiServer.engine.Run(fmt.Sprintf(
		"%s:%s",
		apiServer.config.Host,
		apiServer.config.Port,
	)); err != nil {
		return
	}
	return
}
