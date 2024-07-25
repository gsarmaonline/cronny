package api

import (
	"fmt"
	"log"
	"os"

	"github.com/cronny/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	cronnyConfig "github.com/cronny/config"
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
	if apiServer.db, err = service.NewDb(nil); err != nil {
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
	cronnyApiPrefix := "/api/cronny/v1"
	apiServer.engine.GET("/", apiServer.handler.rootHandler)

	authorized := apiServer.engine.Group(cronnyApiPrefix)
	// TODO: AuthMiddleware not implemented
	authorized.Use(AuthMiddleware())
	{
		authorized.GET("/schedules", apiServer.handler.ScheduleIndexHandler)
		authorized.POST("/schedules", apiServer.handler.ScheduleCreateHandler)
		authorized.PUT("/schedules/:id", apiServer.handler.ScheduleUpdateHandler)
		authorized.DELETE("/schedules/:id", apiServer.handler.ScheduleDeleteHandler)

		authorized.GET("/actions", apiServer.handler.ActionIndexHandler)
		authorized.GET("/actions/:id", apiServer.handler.ActionShowHandler)
		authorized.POST("/actions", apiServer.handler.ActionCreateHandler)
		authorized.PUT("/actions/:id", apiServer.handler.ActionUpdateHandler)
		authorized.DELETE("/actions/:id", apiServer.handler.ActionDeleteHandler)

		authorized.GET("/jobs/:id", apiServer.handler.JobShowHandler)
		authorized.POST("/jobs", apiServer.handler.JobCreateHandler)
		authorized.PUT("/jobs/:id", apiServer.handler.JobUpdateHandler)
		authorized.DELETE("/jobs/:id", apiServer.handler.JobDeleteHandler)

		authorized.GET("/job_templates", apiServer.handler.JobTemplateIndexHandler)
		authorized.POST("/job_templates", apiServer.handler.jobTemplateCreateHandler)
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
