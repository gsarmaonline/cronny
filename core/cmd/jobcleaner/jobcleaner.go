package main

import (
	"log"

	"github.com/cronny/core/models"
	"github.com/cronny/core/service"
	"gorm.io/gorm"
)

func main() {
	var (
		jc  *service.JobExecutionCleaner
		db  *gorm.DB
		err error
	)

	log.Println("Starting JobExecutionCleaner service")

	if db, err = models.NewDb(nil); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if jc, err = service.NewJobExecutionCleaner(db); err != nil {
		log.Fatal("Failed to initialize JobExecutionCleaner:", err)
	}

	log.Println("JobExecutionCleaner service running")
	if err = jc.Run(); err != nil {
		log.Fatal("JobExecutionCleaner service error:", err)
	}
}
