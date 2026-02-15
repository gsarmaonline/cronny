#!/bin/bash

# Cronny Rollback Script
# Rollback to a previous git commit or restore from backup

set -e

# Configuration
ENVIRONMENT="${CRONNY_ENV:-production}"
APP_DIR="/opt/cronny"
DEPLOY_DIR="$APP_DIR/deploy/docker"
BACKUP_DIR="$DEPLOY_DIR/backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Help function
show_help() {
  cat << EOF
Cronny Rollback Script

Usage:
  ./rollback.sh [OPTIONS]

Options:
  -c COMMIT     Rollback to specific git commit
  -p            Rollback to previous commit
  -b BACKUP     Restore database from specific backup file
  -l            List available backups
  -h            Show this help message

Examples:
  ./rollback.sh -p                    # Rollback to previous commit
  ./rollback.sh -c abc123             # Rollback to specific commit
  ./rollback.sh -b backup_file.sql.gz # Restore database backup
  ./rollback.sh -l                    # List available backups

EOF
}

# List backups
list_backups() {
  echo -e "${GREEN}Available backups for ${ENVIRONMENT}:${NC}"
  echo ""
  ls -lh $BACKUP_DIR/cronny_${ENVIRONMENT}_*.sql.gz 2>/dev/null || echo "No backups found"
  echo ""
  if [ -L "$BACKUP_DIR/latest_${ENVIRONMENT}.sql.gz" ]; then
    echo -e "Latest backup: ${BLUE}$(readlink -f $BACKUP_DIR/latest_${ENVIRONMENT}.sql.gz)${NC}"
  fi
}

# Restore database backup
restore_backup() {
  local BACKUP_FILE=$1

  if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
  fi

  log_warning "This will restore the database from: $BACKUP_FILE"
  log_warning "Current database will be REPLACED!"
  read -p "Are you sure? (yes/no): " -r
  if [[ ! $REPLY =~ ^yes$ ]]; then
    log_info "Rollback cancelled"
    exit 0
  fi

  # Load environment variables
  if [ ! -f "$DEPLOY_DIR/.env.${ENVIRONMENT}" ]; then
    log_error "Environment file not found: $DEPLOY_DIR/.env.${ENVIRONMENT}"
    exit 1
  fi
  source $DEPLOY_DIR/.env.${ENVIRONMENT}

  log_info "Creating pre-rollback backup..."
  bash $APP_DIR/deploy/scripts/backup.sh

  log_info "Restoring database from backup..."
  cd $DEPLOY_DIR

  # Decompress if needed
  if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | docker compose -f docker-compose.prod.yml exec -T postgres psql -U $DB_USER -d $DB_NAME
  else
    docker compose -f docker-compose.prod.yml exec -T postgres psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE
  fi

  if [ $? -eq 0 ]; then
    log_success "Database restored successfully!"
  else
    log_error "Database restore failed!"
    exit 1
  fi
}

# Rollback code to commit
rollback_code() {
  local COMMIT=$1

  cd $APP_DIR

  log_info "Current commit: $(git rev-parse HEAD)"
  log_info "Rolling back to: $COMMIT"

  # Verify commit exists
  if ! git cat-file -e $COMMIT^{commit} 2>/dev/null; then
    log_error "Commit not found: $COMMIT"
    exit 1
  fi

  log_warning "This will rollback the code to commit: $COMMIT"
  read -p "Continue? (yes/no): " -r
  if [[ ! $REPLY =~ ^yes$ ]]; then
    log_info "Rollback cancelled"
    exit 0
  fi

  # Create backup before rollback
  log_info "Creating pre-rollback backup..."
  bash $APP_DIR/deploy/scripts/backup.sh

  # Rollback code
  log_info "Rolling back code..."
  git checkout $COMMIT

  # Redeploy
  log_info "Redeploying application..."
  bash $APP_DIR/deploy/scripts/deploy.sh

  log_success "Rollback completed!"
  log_info "New commit: $(git rev-parse HEAD)"
}

# Parse command line arguments
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

while getopts "c:pb:lh" opt; do
  case $opt in
    c)
      rollback_code $OPTARG
      ;;
    p)
      PREV_COMMIT=$(git rev-parse HEAD~1)
      rollback_code $PREV_COMMIT
      ;;
    b)
      BACKUP_FILE=$OPTARG
      if [[ ! $BACKUP_FILE = /* ]]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
      fi
      restore_backup $BACKUP_FILE
      ;;
    l)
      list_backups
      ;;
    h)
      show_help
      ;;
    \?)
      log_error "Invalid option: -$OPTARG"
      show_help
      exit 1
      ;;
  esac
done
