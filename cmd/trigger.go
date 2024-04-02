package main

import (
	"log"

	"github.com/cronny/service"
	"gorm.io/gorm"
)

func getDb() (db *gorm.DB, err error) {
	// TODO: Add config file here
	if db, err = service.NewDb(nil); err != nil {
		return
	}
	return
}

func main() {
	var (
		tc  *service.TriggerCreator
		te  *service.TriggerExecutor
		db  *gorm.DB
		err error

		exitCh chan bool
	)

	exitCh = make(chan bool)

	log.Println("Starting Trigger services")

	if db, err = getDb(); err != nil {
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

	<-exitCh

}
