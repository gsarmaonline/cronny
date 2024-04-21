package main

import (
	"log"

	"github.com/cronny/api"
	"github.com/cronny/service"
	"gorm.io/gorm"
)

func main() {
	var (
		apiServer *api.ApiServer
		tc        *service.TriggerCreator
		te        *service.TriggerExecutor
		db        *gorm.DB
		err       error

		exitCh chan bool
	)
	exitCh = make(chan bool)
	log.Println("Starting Trigger services")

	if db, err = service.NewDb(nil); err != nil {
		log.Fatal(err)
	}
	if tc, err = service.NewTriggerCreator(db); err != nil {
		log.Fatal(err)
	}
	if te, err = service.NewTriggerExecutor(db); err != nil {
		log.Fatal(err)
	}

	go tc.Run()
	go te.Run()

	if apiServer, err = api.NewServer(nil); err != nil {
		log.Fatal(err)
	}
	if err = apiServer.Run(); err != nil {
		log.Fatal(err)
	}

	<-exitCh

}
