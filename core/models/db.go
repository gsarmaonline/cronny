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
		Host:     getEnvOrDefault("PG_HOST", "pg-cronny.flycast"),
		Port:     getEnvOrDefault("PG_PORT", "5432"),
		Username: getEnvOrDefault("PG_USERNAME", "postgres"),
		Password: os.Getenv("PG_PASSWORD"), // Required - no default for security
		DbName:   getEnvOrDefault("PG_DBNAME", "cronny_dev"),
	}
	return
}

// getEnvOrDefault returns the environment variable value or a default if not set
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
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
	// Use UTC as default timezone, or get from environment
	timezone := os.Getenv("DB_TIMEZONE")
	if timezone == "" {
		timezone = "UTC"
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=%s",
		cfg.Host,
		cfg.Username,
		cfg.Password,
		cfg.DbName,
		cfg.Port,
		timezone,
	)
	log.Println("Connecting to PostgreSQL database")
	if db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{}); err != nil {
		return
	}
	return
}

func SetupModels(db *gorm.DB) (err error) {
	models := []interface{}{
		&User{},
		&Schedule{},
		&Trigger{},
		&Action{},
		&Job{},
		&JobTemplate{},
		&JobExecution{},
		&Plan{},
		&Feature{},
	}

	for _, model := range models {
		if err = db.AutoMigrate(model); err != nil {
			return fmt.Errorf("failed to auto-migrate model %T: %w", model, err)
		}
	}

	log.Println("All models migrated successfully")
	return nil
}
