package config

import (
	"os"
	"time"
)

var (
	// Cronny Environments
	DevelopmentEnv = "development"
	StagingEnv     = "staging"
	ProductionEnv  = "production"

	// Environment variables
	CronnyEnvVar = "CRONNY_ENV"

	// Job Configuration Control
	DefaultJobTimeoutInSecs = 60

	// JWT Configuration
	JWTSecret     = getEnvOrDefault("JWT_SECRET", "your-secret-key-change-in-production")
	JWTExpiration = 24 * time.Hour // token valid for 24 hours
)

// getEnvOrDefault returns the environment variable value or a default if not set
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
