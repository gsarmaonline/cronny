package main

import (
	"log"

	"github.com/cronny/core/models"
	"github.com/cronny/core/service"
	"gorm.io/gorm"
)

func main() {
	var (
		te  *service.TriggerExecutor
		db  *gorm.DB
		err error
	)

	log.Println("Starting TriggerExecutor service")

	if db, err = models.NewDb(nil); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if te, err = service.NewTriggerExecutor(db); err != nil {
		log.Fatal("Failed to initialize TriggerExecutor:", err)
	}

	log.Println("TriggerExecutor service running")
	if err = te.Run(); err != nil {
		log.Fatal("TriggerExecutor service error:", err)
	}
}
