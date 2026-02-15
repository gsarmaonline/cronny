package config

import (
	"errors"
	"fmt"
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
	JWTSecret     = getJWTSecret()
	JWTExpiration = 24 * time.Hour // token valid for 24 hours
)

// getJWTSecret returns JWT secret from environment
// In production, JWT_SECRET must be set
func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	env := os.Getenv(CronnyEnvVar)

	// Allow default only in development
	if secret == "" {
		if env == ProductionEnv || env == StagingEnv {
			panic("JWT_SECRET environment variable must be set in production/staging")
		}
		// Development fallback
		return "dev-secret-key-change-in-production"
	}

	return secret
}

// getEnvOrDefault returns the environment variable value or a default if not set
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// ValidateConfig validates required environment variables based on the environment
func ValidateConfig() error {
	env := os.Getenv(CronnyEnvVar)
	var errs []error

	// JWT_SECRET is critical for security
	if JWTSecret == "" {
		errs = append(errs, errors.New("JWT_SECRET must be set"))
	}

	// In production/staging, enforce stricter validation
	if env == ProductionEnv || env == StagingEnv {
		// JWT secret must not be the default
		if JWTSecret == "dev-secret-key-change-in-production" {
			errs = append(errs, errors.New("JWT_SECRET must not use the default value in production/staging"))
		}

		// PostgreSQL password must be set if using PostgreSQL
		if os.Getenv("USE_PG") == "yes" && os.Getenv("PG_PASSWORD") == "" {
			errs = append(errs, errors.New("PG_PASSWORD must be set when using PostgreSQL in production/staging"))
		}
	}

	if len(errs) > 0 {
		var errMsg string
		for i, err := range errs {
			if i > 0 {
				errMsg += "; "
			}
			errMsg += err.Error()
		}
		return fmt.Errorf("configuration validation failed: %s", errMsg)
	}

	return nil
}
