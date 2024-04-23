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

	apiServer.engine.GET(cronnyApiPrefix+"/schedules", apiServer.handler.ScheduleIndexHandler)
	apiServer.engine.POST(cronnyApiPrefix+"/schedules", apiServer.handler.ScheduleCreateHandler)
	apiServer.engine.PUT(cronnyApiPrefix+"/schedules/:id", apiServer.handler.ScheduleUpdateHandler)
	apiServer.engine.DELETE(cronnyApiPrefix+"/schedules/:id", apiServer.handler.ScheduleDeleteHandler)

	apiServer.engine.GET(cronnyApiPrefix+"/actions", apiServer.handler.ActionIndexHandler)
	apiServer.engine.GET(cronnyApiPrefix+"/actions/:id", apiServer.handler.ActionShowHandler)
	apiServer.engine.POST(cronnyApiPrefix+"/actions", apiServer.handler.ActionCreateHandler)
	apiServer.engine.PUT(cronnyApiPrefix+"/actions/:id", apiServer.handler.ActionUpdateHandler)
	apiServer.engine.DELETE(cronnyApiPrefix+"/actions/:id", apiServer.handler.ActionDeleteHandler)

	apiServer.engine.GET(cronnyApiPrefix+"/jobs/:id", apiServer.handler.JobShowHandler)
	apiServer.engine.POST(cronnyApiPrefix+"/jobs", apiServer.handler.JobCreateHandler)
	apiServer.engine.PUT(cronnyApiPrefix+"/jobs/:id", apiServer.handler.JobUpdateHandler)
	apiServer.engine.DELETE(cronnyApiPrefix+"/jobs/:id", apiServer.handler.JobDeleteHandler)

	apiServer.engine.GET(cronnyApiPrefix+"/job_templates", apiServer.handler.JobTemplateIndexHandler)
	apiServer.engine.POST(cronnyApiPrefix+"/job_templates", apiServer.handler.jobTemplateCreateHandler)

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
