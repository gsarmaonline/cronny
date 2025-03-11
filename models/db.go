package models

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type (
	DbConfig struct {
		Host     string `json:"host"`
		Port     string `json:"port"`
		Username string `json:"username"`
		Password string `json:"password"`
		DbName   string `json:"db_name"`
	}
)

func GetDefaultPgDbConfig() (cfg *DbConfig) {
	cfg = &DbConfig{
		Host:     "pg-cronny.flycast",
		Port:     "5432",
		Username: "postgres",
		Password: "msmcuS2ZbHUJizs",
		DbName:   "cronny_dev",
	}
	return
}

func GetDefaultDbConfig() (cfg *DbConfig) {
	cfg = &DbConfig{
		Host:     "127.0.0.1",
		Port:     "3306",
		Username: "root",
		Password: "",
		DbName:   "cronny_dev",
	}
	return
}

func NewDb(cfg *DbConfig) (db *gorm.DB, err error) {
	if cfg == nil {
		log.Println("No DbConfig found. Falling back to default config")
		cfg = GetDefaultDbConfig()
	}
	if os.Getenv("USE_PG") == "yes" {
		log.Println("Setting up PostgreSQL")
		cfg = GetDefaultPgDbConfig()

		if db, err = NewPostgresDb(cfg); err != nil {
			return
		}
	} else {
		log.Println("Setting up MySQL")
		if db, err = NewMysqlDb(cfg); err != nil {
			return
		}
	}
	if err = SetupModels(db); err != nil {
		return
	}
	return
}

func NewMysqlDb(cfg *DbConfig) (db *gorm.DB, err error) {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.Username,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.DbName,
	)
	if db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{}); err != nil {
		return
	}
	return
}

func NewPostgresDb(cfg *DbConfig) (db *gorm.DB, err error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Kolkata",
		cfg.Host,
		cfg.Username,
		cfg.Password,
		cfg.DbName,
		cfg.Port,
	)
	log.Println(dsn)
	if db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{}); err != nil {
		return
	}
	return
}

func SetupModels(db *gorm.DB) (err error) {
	db.AutoMigrate(&User{})
	db.AutoMigrate(&Schedule{})
	db.AutoMigrate(&Trigger{})
	db.AutoMigrate(&Action{})
	db.AutoMigrate(&Job{})
	db.AutoMigrate(&JobTemplate{})
	db.AutoMigrate(&JobExecution{})
	return
}
