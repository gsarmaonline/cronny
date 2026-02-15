package helpers

import (
	"fmt"
	"log"
	"time"
)

// Logger provides structured logging with context
type Logger struct {
	prefix string
}

// NewLogger creates a new logger with a prefix
func NewLogger(prefix string) *Logger {
	return &Logger{prefix: prefix}
}

// Info logs an informational message with context
func (l *Logger) Info(msg string, keysAndValues ...interface{}) {
	l.log("INFO", msg, keysAndValues...)
}

// Error logs an error message with context
func (l *Logger) Error(msg string, err error, keysAndValues ...interface{}) {
	keysAndValues = append(keysAndValues, "error", err.Error())
	l.log("ERROR", msg, keysAndValues...)
}

// Warn logs a warning message with context
func (l *Logger) Warn(msg string, keysAndValues ...interface{}) {
	l.log("WARN", msg, keysAndValues...)
}

// log formats and outputs a structured log message
func (l *Logger) log(level, msg string, keysAndValues ...interface{}) {
	timestamp := time.Now().UTC().Format(time.RFC3339)
	logMsg := fmt.Sprintf("[%s] %s [%s] %s", timestamp, level, l.prefix, msg)

	if len(keysAndValues) > 0 {
		logMsg += " |"
		for i := 0; i < len(keysAndValues); i += 2 {
			if i+1 < len(keysAndValues) {
				logMsg += fmt.Sprintf(" %v=%v", keysAndValues[i], keysAndValues[i+1])
			}
		}
	}

	log.Println(logMsg)
}
