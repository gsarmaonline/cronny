runall: install-concurrently
	make setup
	npx concurrently --kill-others "cd cmd/api && CRONNY_ENV=development $(HOME)/go/bin/air" "make ui-start"

runapi:
	make setup
	CRONNY_ENV=development go run cmd/api/api.go

runapi-dev:
	make setup
	cd cmd/api && CRONNY_ENV=development $(HOME)/go/bin/air

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
	CRONNY_ENV=development go run cmd/seed/seed.go

setup:
	mysql -uroot -e "CREATE DATABASE IF NOT EXISTS cronny_dev;" 
	mysql -uroot -e "CREATE DATABASE IF NOT EXISTS cronny_test;" 

clean:
	mysql -uroot -e "DROP DATABASE IF EXISTS cronny_dev;" 
	mysql -uroot -e "DROP DATABASE IF EXISTS cronny_test;" 
	make setup

runexamples:
	bash api/examples.sh

# Help target to display available commands
help:
	@echo "Available commands:"
	@echo "  make runall          - Run all services"
	@echo "  make runapi          - Run API server only"
	@echo "  make runapi-dev      - Run API server with hot reloading"
	@echo "  make ui-install      - Install UI dependencies"
	@echo "  make ui-start        - Start UI development server"
	@echo "  make ui-build        - Build UI for production"
	@echo "  make run-dev         - Run both API and UI for development"
	@echo "  make seed            - Reset database and seed with initial data"
	@echo "  make setup           - Create databases if they don't exist"
	@echo "  make clean           - Drop databases and recreate them"
	@echo "  make runexamples     - Run API examples"

.PHONY: runall runapi runapi-dev ui-install ui-start ui-build run-dev install-concurrently seed setup clean runexamples help
