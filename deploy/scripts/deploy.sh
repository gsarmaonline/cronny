#!/bin/bash

# Cronny Deployment Script
# Deploy or update the Cronny application

set -e

# Configuration
ENVIRONMENT="${CRONNY_ENV:-production}"
APP_DIR="/opt/cronny"
DEPLOY_DIR="$APP_DIR/deploy/docker"
REPO_BRANCH="${DEPLOY_BRANCH:-main}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-true}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running from correct directory
cd $APP_DIR

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Cronny Deployment${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "Environment: ${BLUE}${ENVIRONMENT}${NC}"
echo -e "Branch: ${BLUE}${REPO_BRANCH}${NC}"
echo -e "Time: ${BLUE}$(date)${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$DEPLOY_DIR/.env.${ENVIRONMENT}" ]; then
  log_error "Environment file not found: $DEPLOY_DIR/.env.${ENVIRONMENT}"
  log_info "Please create it from .env.example and configure all variables"
  exit 1
fi

# Step 1: Backup database
if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
  log_info "[1/8] Creating database backup..."
  if [ -f "$APP_DIR/deploy/scripts/backup.sh" ]; then
    bash $APP_DIR/deploy/scripts/backup.sh || log_warning "Backup failed, continuing anyway..."
  else
    log_warning "Backup script not found, skipping backup"
  fi
else
  log_info "[1/8] Skipping database backup (disabled)"
fi

# Step 2: Pull latest code
log_info "[2/8] Pulling latest code from $REPO_BRANCH..."
git fetch origin
CURRENT_COMMIT=$(git rev-parse HEAD)
git checkout $REPO_BRANCH
git pull origin $REPO_BRANCH
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
  log_info "No new changes found"
else
  log_success "Updated from $CURRENT_COMMIT to $NEW_COMMIT"
fi

# Step 3: Copy environment file
log_info "[3/8] Setting up environment variables..."
cp $DEPLOY_DIR/.env.${ENVIRONMENT} $DEPLOY_DIR/.env
export CRONNY_ENV=$ENVIRONMENT
export REPO_PATH=$APP_DIR

# Step 4: Build Docker images
log_info "[4/8] Building Docker images..."
cd $DEPLOY_DIR
docker compose -f docker-compose.prod.yml build --no-cache

# Step 5: Stop old containers (gracefully)
log_info "[5/8] Stopping old containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true

# Step 6: Start new containers
log_info "[6/8] Starting new containers..."
docker compose -f docker-compose.prod.yml up -d

# Step 7: Wait for services to be healthy
log_info "[7/8] Waiting for services to be healthy..."
sleep 10

# Check service health
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if docker compose -f docker-compose.prod.yml ps | grep -q "unhealthy\|starting"; then
    log_info "Waiting for services to become healthy... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT + 1))
  else
    break
  fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  log_error "Services failed to become healthy within timeout"
  log_info "Container status:"
  docker compose -f docker-compose.prod.yml ps
  log_info "Checking logs..."
  docker compose -f docker-compose.prod.yml logs --tail=50
  exit 1
fi

# Step 8: Cleanup old images
log_info "[8/8] Cleaning up old images..."
docker image prune -f

# Display container status
echo ""
log_success "Deployment completed successfully!"
echo ""
log_info "Container status:"
docker compose -f docker-compose.prod.yml ps
echo ""
log_info "Quick checks:"
echo -e "  - API health: ${YELLOW}curl -k https://cronny.app/api/health${NC}"
echo -e "  - Frontend: ${YELLOW}curl -k https://cronny.app${NC}"
echo ""
log_info "View logs:"
echo -e "  - All logs: ${YELLOW}docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "  - API logs: ${YELLOW}docker compose -f docker-compose.prod.yml logs -f api${NC}"
echo -e "  - Frontend logs: ${YELLOW}docker compose -f docker-compose.prod.yml logs -f frontend${NC}"
echo ""
log_info "Deployment details:"
echo -e "  - Commit: ${BLUE}$NEW_COMMIT${NC}"
echo -e "  - Time: ${BLUE}$(date)${NC}"
echo ""

# Save deployment info
cat > $APP_DIR/deploy/last-deployment.json <<EOF
{
  "environment": "$ENVIRONMENT",
  "commit": "$NEW_COMMIT",
  "branch": "$REPO_BRANCH",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployed_by": "$USER"
}
EOF

log_success "Deployment complete! 🚀"
