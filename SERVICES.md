# Cronny Service Architecture

This document describes the service architecture of Cronny and how to run/deploy each service.

## Service Overview

Cronny consists of **5 independent services** that share a common codebase but can be deployed separately:

### 1. API Server (`cmd/api`)
**Purpose**: REST API for frontend communication
**Port**: 8009 (dev) / 8080 (prod)
**Stateless**: Yes (horizontally scalable)
**Database**: Read/Write

**Responsibilities**:
- Handle HTTP requests from the frontend
- CRUD operations for schedules, actions, jobs, templates
- User authentication and authorization
- Dashboard statistics

**Does NOT**:
- Create or execute triggers
- Run background tasks

### 2. Trigger Creator (`cmd/triggercreator`)
**Purpose**: Converts schedules into executable triggers
**Stateless**: No (single instance recommended)
**Database**: Read/Write

**How it works**:
1. Polls for schedules with status `Pending` (every 1 second)
2. For each schedule, creates a trigger with the next execution time
3. Updates schedule status to `Processing`

**Why single instance**:
- Avoids duplicate trigger creation
- Uses database locks for safety if multiple instances run

### 3. Trigger Executor (`cmd/triggerexecutor`)
**Purpose**: Executes triggers when they're due
**Stateless**: Partially (can scale horizontally)
**Concurrency**: 10 workers per instance
**Database**: Read/Write

**How it works**:
1. Polls for triggers that are due (every 1 second)
2. Sends triggers to internal channel (buffer: 1024)
3. 10 concurrent workers process triggers from the channel
4. For each trigger:
   - Updates status to `Executing`
   - Creates the next trigger for recurring schedules
   - Executes the associated action (runs all jobs)
   - Updates status to `Completed` or `Failed`

**Scaling**:
- Can run multiple instances for higher throughput
- Each instance runs 10 workers
- Database ensures trigger execution happens only once (via status locks)

### 4. Job Execution Cleaner (`cmd/jobcleaner`)
**Purpose**: Cleans old job execution records
**Stateless**: Yes
**Database**: Read/Write

**How it works**:
1. Runs every 1 minute
2. For each job, keeps only the last 10 executions
3. Deletes older executions to prevent database bloat

**Why needed**:
- Job executions are stored for debugging/auditing
- Without cleanup, the table grows indefinitely

### 5. All-in-One (`cmd/all`)
**Purpose**: Development convenience - runs API + both trigger services
**Use case**: Local development only
**NOT recommended for production**

## Deployment Modes

### Development (Local)

#### Option A: All-in-One (Simple)
```bash
make runall
```
Runs API + TriggerCreator + TriggerExecutor + UI in one process.

#### Option B: Separate Services (Mirrors Production)
```bash
make run-all-services
```
Runs each service separately:
- API with hot reload
- TriggerCreator
- TriggerExecutor
- JobCleaner
- UI dev server

#### Option C: Individual Services (Debugging)
```bash
# Terminal 1: API
make runapi-dev

# Terminal 2: Trigger Creator
make run-triggercreator

# Terminal 3: Trigger Executor
make run-triggerexecutor

# Terminal 4: Job Cleaner
make run-jobcleaner

# Terminal 5: UI
make ui-start
```

### Production (Docker)

#### Using Docker Compose
```bash
cd build
cp .env.example .env
# Edit .env with your configuration
docker-compose up -d
```

This starts:
- `api` - API server (port 8080)
- `frontend` - React UI (port 80)
- `triggercreator` - Trigger creator service
- `triggerexecutor` - Trigger executor service
- `jobcleaner` - Job cleaner service
- `postgres` - PostgreSQL database

#### Individual Docker Images
```bash
# Build images
docker build -t cronnyapi -f build/Dockerfile.api .
docker build -t cronnytriggercreator -f build/Dockerfile.triggercreator .
docker build -t cronnytriggerexecutor -f build/Dockerfile.triggerexecutor .
docker build -t cronnyjobcleaner -f build/Dockerfile.jobcleaner .
docker build -t cronnyfrontend -f build/Dockerfile.frontend .

# Run individually
docker run -e DB_HOST=... cronnyapi
docker run -e DB_HOST=... cronnytriggercreator
docker run -e DB_HOST=... cronnytriggerexecutor
docker run -e DB_HOST=... cronnyjobcleaner
```

## Service Dependencies

```
                    ┌─────────────┐
                    │   Frontend  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  API Server │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Database  │◄───────────┐
                    └──────┬──────┘            │
                           │                   │
              ┌────────────┼────────────┐     │
              │            │            │     │
              ▼            ▼            ▼     │
       ┌────────────┐ ┌─────────┐ ┌─────────┐
       │  Trigger   │ │ Trigger │ │   Job   │
       │  Creator   │ │Executor │ │ Cleaner │
       └────────────┘ └─────────┘ └─────────┘
```

**Dependency Rules**:
- Frontend → API (HTTP)
- All services → Database (TCP)
- Services don't communicate with each other (database-mediated coordination)

## Database Schema Usage

| Service | Reads | Writes | Tables |
|---------|-------|--------|--------|
| API | All | Schedules, Actions, Jobs, Users | All |
| TriggerCreator | Schedules | Triggers, Schedules | schedules, triggers |
| TriggerExecutor | Triggers, Schedules, Actions, Jobs | Triggers, JobExecutions | triggers, schedules, actions, jobs, job_executions |
| JobCleaner | Jobs, JobExecutions | JobExecutions | jobs, job_executions |

## Scaling Recommendations

### Small Deployment (< 1000 schedules)
- 1x API server
- 1x TriggerCreator
- 1x TriggerExecutor
- 1x JobCleaner

### Medium Deployment (1000-10,000 schedules)
- 2-3x API servers (load balanced)
- 1x TriggerCreator
- 2-3x TriggerExecutor
- 1x JobCleaner

### Large Deployment (> 10,000 schedules)
- 3-5x API servers (load balanced)
- 1-2x TriggerCreator (with database locks)
- 5-10x TriggerExecutor
- 1x JobCleaner

**Note**: TriggerCreator should generally be a single instance to avoid duplicate trigger creation, though multiple instances are safe due to database locking.

## Health Checks

None of the services currently expose health check endpoints. To add:

```go
// In each cmd main.go, add:
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
})
go http.ListenAndServe(":8080", nil)
```

## Monitoring

Key metrics to monitor:

| Metric | Service | Importance |
|--------|---------|------------|
| Pending schedules count | TriggerCreator | High |
| Overdue triggers count | TriggerExecutor | Critical |
| Failed trigger count | TriggerExecutor | High |
| API response time | API | Medium |
| Database connection pool | All | High |

## Troubleshooting

### Triggers not being created
- Check TriggerCreator logs
- Verify schedules have status `Pending`
- Check database connectivity

### Triggers not executing
- Check TriggerExecutor logs
- Verify triggers have `scheduled_at` <= current time
- Check if workers are blocked (look for long-running jobs)

### Database growing too fast
- Check JobCleaner is running
- Verify JobCleaner logs show cleanup activity
- Adjust `AllowedJobExecutionsPerJob` if needed (default: 10)

### High memory usage
- TriggerExecutor channel buffer might be full (1024 triggers)
- Reduce concurrency from 10 to 5 workers
- Scale horizontally instead of increasing workers

## Configuration

All services use the same configuration via environment variables:

```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=cronny_dev
DB_PORT=3306
USE_PG=no  # Set to "yes" for PostgreSQL

# Application
CRONNY_ENV=development  # or "production"
PORT=8009  # API server port (ignored by other services)
```

## Next Steps

Consider adding:
1. Health check endpoints for all services
2. Prometheus metrics export
3. Graceful shutdown handlers
4. Service discovery (e.g., Consul)
5. Circuit breakers for external job executions
6. Dead letter queue for failed triggers
