package api

import (
	"fmt"

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
		Host: "127.0.0.1",
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
		return
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
	apiServer.engine.GET("/api/cronny/v1/schedules", apiServer.handler.rootHandler)
	apiServer.engine.GET("/api/cronny/v1/actions", apiServer.handler.ActionIndexHandler)
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
