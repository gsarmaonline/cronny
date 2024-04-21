package api

import (
	"fmt"
	"log"

	"github.com/cronny/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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
	config = &ApiServerConfig{
		Host: "0.0.0.0",
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
	apiServer.engine.GET("/", apiServer.handler.rootHandler)

	apiServer.engine.GET("/api/cronny/v1/schedules", apiServer.handler.ScheduleIndexHandler)
	apiServer.engine.POST("/api/cronny/v1/schedules", apiServer.handler.ScheduleCreateHandler)
	apiServer.engine.PUT("/api/cronny/v1/schedules/:id", apiServer.handler.ScheduleUpdateHandler)
	apiServer.engine.DELETE("/api/cronny/v1/schedules/:id", apiServer.handler.ScheduleDeleteHandler)

	apiServer.engine.GET("/api/cronny/v1/actions", apiServer.handler.ActionIndexHandler)
	apiServer.engine.GET("/api/cronny/v1/actions/:id", apiServer.handler.ActionShowHandler)
	apiServer.engine.POST("/api/cronny/v1/actions", apiServer.handler.ActionCreateHandler)
	apiServer.engine.PUT("/api/cronny/v1/actions/:id", apiServer.handler.ActionUpdateHandler)
	apiServer.engine.DELETE("/api/cronny/v1/actions/:id", apiServer.handler.ActionDeleteHandler)

	apiServer.engine.GET("/api/cronny/v1/jobs/:id", apiServer.handler.JobShowHandler)
	apiServer.engine.POST("/api/cronny/v1/jobs", apiServer.handler.JobCreateHandler)
	apiServer.engine.PUT("/api/cronny/v1/jobs/:id", apiServer.handler.JobUpdateHandler)
	apiServer.engine.DELETE("/api/cronny/v1/jobs/:id", apiServer.handler.JobDeleteHandler)

	apiServer.engine.GET("/api/cronny/v1/job_templates", apiServer.handler.JobTemplateIndexHandler)

	return
}

func (apiServer *ApiServer) Run() (err error) {
	if err = apiServer.engine.Run(fmt.Sprintf(
		"%s:%s",
		apiServer.config.Host,
		apiServer.config.Port,
	)); err != nil {
		return
	}
	return
}
