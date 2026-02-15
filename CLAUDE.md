# Cronny - Project Guide for Claude Code

Cronny is a cron job manager and scheduler application that allows users to define actions triggered at different intervals (absolute dates, recurring schedules, or relative intervals).

## Project Structure

```
.
├── core/                  # Go backend
│   ├── actions/          # Action implementations (HTTP, Slack, Docker, etc.)
│   ├── api/              # REST API handlers and middleware
│   ├── cmd/              # Entry points (api, seed, all)
│   ├── config/           # Configuration management
│   ├── helpers/          # Utilities (Docker executor, etc.)
│   ├── migrations/       # Database migrations
│   ├── models/           # Data models (Schedule, Trigger, Job, Action, etc.)
│   └── service/          # Core services (trigger creator/executor, cleaners)
├── cronui/               # React frontend
│   └── src/
│       └── components/   # UI components (Dashboard, Actions, Jobs, etc.)
└── bin/                  # Compiled binaries (created during build)
```

## Technology Stack

- **Backend**: Go 1.23+ with Gin web framework, GORM ORM
- **Frontend**: React with TypeScript
- **Database**: MySQL (primary), PostgreSQL/SQLite supported
- **Dev Tools**: air (hot reloading), concurrently
- **Container**: Docker support for API, frontend, trigger services

## Key Concepts

### Planning Models
- **Schedule**: User-defined trigger times (absolute, recurring, or relative)
- **Trigger**: Specific execution points derived from schedules
- **Trigger Creator**: Service that generates triggers from schedules
- **Trigger Executor**: Service that executes triggers when due

### Execution Models
- **Action**: Collection of jobs to execute when triggered
- **Job**: Individual execution unit with specific input/output
- **JobTemplate**: Type of job (HTTP, Slack, Logger, Docker, etc.)
- **Condition**: Rules controlling job execution flow
- **Connector**: Links jobs together, passing outputs as inputs

## Development Commands

### Local Development
```bash
# Setup databases (required first time)
make setup                  # Creates cronny_dev and cronny_test databases

# Seed database with test data
make seed                   # Drops and recreates DBs, runs seed script

# Run everything (API + UI with hot reload)
make runall                 # Requires concurrently installed

# Run API only
make runapi                 # Standard run
make runapi-dev             # With air hot reloading

# Run UI only
make ui-install             # Install dependencies first
make ui-start               # Start dev server
```

### Testing
```bash
make test                   # Run all Go tests
make test-coverage          # Generate coverage report
```

### Building
```bash
make build                  # Build both API and frontend
make build-api              # Build cronnyapi binary
make build-frontend         # Build React production bundle
```

### Docker
```bash
docker build -t cronnyapi -f Dockerfile.api .
docker build -t cronnyfrontend -f Dockerfile.frontend .
docker build -t cronnytriggercreator -f Dockerfile.triggercreator .
docker build -t cronnytriggerexecutor -f Dockerfile.triggerexecutor .
```

## Database

- **Development DB**: `cronny_dev` (MySQL, no password for root)
- **Test DB**: `cronny_test`
- Migrations are in `core/migrations/`
- Models use GORM with auto-migration support

## Code Patterns

### Go Backend
- RESTful API using Gin router
- Models extend `BaseModel` (ID, CreatedAt, UpdatedAt, DeletedAt)
- Authentication via JWT with Google OAuth support
- Middleware: auth, user scope validation
- Test files use `*_test.go` naming

### Frontend
- TypeScript React components
- API calls to backend at `/api/cronny/v1/*`
- Component structure: List, Form, Detail patterns

## API Endpoints

Base URL: `http://127.0.0.1:8009/api/cronny/v1`

- `/job_templates` - Job template CRUD
- `/actions` - Action CRUD
- `/jobs` - Job CRUD
- `/schedules` - Schedule CRUD
- `/dashboard` - Dashboard stats
- `/users` - User management
- Authentication endpoints for Google OAuth

## Important Notes

- Always run `make setup` before first run or after `make clean`
- The API runs on port 8009 by default
- Use `CRONNY_ENV=development` for local development
- The trigger services are separate from the API server
- Jobs execute sequentially within an action (no concurrent execution within action)
- Schedule states: Pending → Scheduled → Processed
- Trigger states: Scheduled → Executing → Completed/Failed

## Testing Philosophy

- Write tests for core business logic
- Test files located alongside source files
- Use testify/assert for assertions
- Test database operations use `cronny_test` DB

## Git Workflow

- Main branch: `main`
- Current branch: `add-claude-md`
- GitHub Actions configured for build and code review
- Recent focus: Adding project-specific changes
- **PR Guidelines**: For any frontend changes, include screenshots of the page being changed in the pull request

## Environment Variables

Set `CRONNY_ENV=development` for local development to use proper configuration.
