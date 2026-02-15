package main

import (
	"log"

	"github.com/cronny/core/models"
	"github.com/cronny/core/service"
	"gorm.io/gorm"
)

func main() {
	var (
		tc  *service.TriggerCreator
		db  *gorm.DB
		err error
	)

	log.Println("Starting TriggerCreator service")

	if db, err = models.NewDb(nil); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if tc, err = service.NewTriggerCreator(db); err != nil {
		log.Fatal("Failed to initialize TriggerCreator:", err)
	}

	log.Println("TriggerCreator service running")
	if err = tc.Run(); err != nil {
		log.Fatal("TriggerCreator service error:", err)
	}
}
