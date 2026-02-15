runall: install-concurrently
	make setup
	npx concurrently --kill-others "cd core && CRONNY_ENV=development $(HOME)/go/bin/air" "make ui-start"

runapi:
	make setup
	cd core && CRONNY_ENV=development go run cmd/api/api.go

runapi-dev:
	make setup
	cd core && CRONNY_ENV=development $(HOME)/go/bin/air

# Background service targets
run-triggercreator:
	make setup
	cd core && CRONNY_ENV=development go run cmd/triggercreator/triggercreator.go

run-triggerexecutor:
	make setup
	cd core && CRONNY_ENV=development go run cmd/triggerexecutor/triggerexecutor.go

run-jobcleaner:
	make setup
	cd core && CRONNY_ENV=development go run cmd/jobcleaner/jobcleaner.go

# Run all services separately (for testing individual services)
run-all-services: install-concurrently
	make setup
	npx concurrently --kill-others \
		"make runapi-dev" \
		"make run-triggercreator" \
		"make run-triggerexecutor" \
		"make run-jobcleaner" \
		"make ui-start"

# UI related targets
ui-install:
	cd cronui && npm install

ui-start:
	cd cronui && npm start

ui-build:
	cd cronui && npm run build

# Start both API and UI in development mode
# This requires concurrently package
run-dev: install-concurrently
	npx concurrently --kill-others "make runapi-dev" "make ui-start"

# Install concurrently if not already installed
install-concurrently:
	npm list -g concurrently || npm install -g concurrently

seed:
	mysql -uroot -e "DROP DATABASE IF EXISTS cronny_dev;"
	mysql -uroot -e "DROP DATABASE IF EXISTS cronny_test;"
	make setup
	cd core && CRONNY_ENV=development go run cmd/seed/seed.go

setup:
	mysql -uroot -e "CREATE DATABASE IF NOT EXISTS cronny_dev;" 
	mysql -uroot -e "CREATE DATABASE IF NOT EXISTS cronny_test;" 

clean:
	mysql -uroot -e "DROP DATABASE IF EXISTS cronny_dev;" 
	mysql -uroot -e "DROP DATABASE IF EXISTS cronny_test;" 
	make setup

runexamples:
	bash core/api/examples.sh

# Test targets
test:
	cd core && go test ./... -v

test-coverage:
	cd core && go test ./... -v -coverprofile=coverage.out && go tool cover -html=coverage.out -o coverage.html

# Build targets
build-api:
	cd core && CGO_ENABLED=0 GOOS=linux go build -o ../bin/cronnyapi cmd/all/all.go

build-triggercreator:
	cd core && CGO_ENABLED=0 GOOS=linux go build -o ../bin/triggercreator cmd/triggercreator/triggercreator.go

build-triggerexecutor:
	cd core && CGO_ENABLED=0 GOOS=linux go build -o ../bin/triggerexecutor cmd/triggerexecutor/triggerexecutor.go

build-jobcleaner:
	cd core && CGO_ENABLED=0 GOOS=linux go build -o ../bin/jobcleaner cmd/jobcleaner/jobcleaner.go

build-frontend:
	make ui-build

build: build-api build-triggercreator build-triggerexecutor build-jobcleaner build-frontend

# Help target to display available commands
help:
	@echo "Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  make runall              - Run all services in one process (API + triggers)"
	@echo "  make runapi              - Run API server only"
	@echo "  make runapi-dev          - Run API server with hot reloading"
	@echo "  make run-all-services    - Run all services separately (API, triggers, UI)"
	@echo "  make run-triggercreator  - Run TriggerCreator service only"
	@echo "  make run-triggerexecutor - Run TriggerExecutor service only"
	@echo "  make run-jobcleaner      - Run JobCleaner service only"
	@echo ""
	@echo "UI:"
	@echo "  make ui-install          - Install UI dependencies"
	@echo "  make ui-start            - Start UI development server"
	@echo "  make ui-build            - Build UI for production"
	@echo ""
	@echo "Database:"
	@echo "  make seed                - Reset database and seed with initial data"
	@echo "  make setup               - Create databases if they don't exist"
	@echo "  make clean               - Drop databases and recreate them"
	@echo ""
	@echo "Testing:"
	@echo "  make test                - Run all Go tests"
	@echo "  make test-coverage       - Run tests with coverage report"
	@echo ""
	@echo "Building:"
	@echo "  make build               - Build all services and frontend"
	@echo "  make build-api           - Build API binary"
	@echo "  make build-triggercreator  - Build TriggerCreator binary"
	@echo "  make build-triggerexecutor - Build TriggerExecutor binary"
	@echo "  make build-jobcleaner    - Build JobCleaner binary"
	@echo "  make build-frontend      - Build frontend for production"

.PHONY: runall runapi runapi-dev run-triggercreator run-triggerexecutor run-jobcleaner run-all-services ui-install ui-start ui-build run-dev install-concurrently seed setup clean runexamples help test test-coverage build-api build-triggercreator build-triggerexecutor build-jobcleaner build-frontend build
