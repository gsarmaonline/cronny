#!/bin/bash

# Cronny Database Backup Script
# Creates timestamped backups of the PostgreSQL database

set -e

# Configuration
ENVIRONMENT="${CRONNY_ENV:-production}"
APP_DIR="/opt/cronny"
DEPLOY_DIR="$APP_DIR/deploy/docker"
BACKUP_DIR="$DEPLOY_DIR/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

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

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Cronny Database Backup${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "Environment: ${BLUE}${ENVIRONMENT}${NC}"
echo -e "Time: ${BLUE}$(date)${NC}"
echo ""

# Load environment variables
if [ ! -f "$DEPLOY_DIR/.env.${ENVIRONMENT}" ]; then
  log_error "Environment file not found: $DEPLOY_DIR/.env.${ENVIRONMENT}"
  exit 1
fi

source $DEPLOY_DIR/.env.${ENVIRONMENT}

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cronny_${ENVIRONMENT}_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

log_info "Creating database backup..."

# Create backup using docker exec
cd $DEPLOY_DIR
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
  # Compress backup
  log_info "Compressing backup..."
  gzip $BACKUP_FILE

  # Get file size
  SIZE=$(du -h $BACKUP_FILE_GZ | cut -f1)

  log_success "Backup created: $BACKUP_FILE_GZ (${SIZE})"

  # Create latest symlink
  ln -sf $(basename $BACKUP_FILE_GZ) $BACKUP_DIR/latest_${ENVIRONMENT}.sql.gz

  # Cleanup old backups
  log_info "Cleaning up backups older than $RETENTION_DAYS days..."
  find $BACKUP_DIR -name "cronny_${ENVIRONMENT}_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

  # List all backups
  log_info "Available backups:"
  ls -lh $BACKUP_DIR/cronny_${ENVIRONMENT}_*.sql.gz | tail -5

  echo ""
  log_success "Backup completed successfully!"

  # Optional: Upload to cloud storage
  if command -v s3cmd &> /dev/null && [ -n "${S3_BACKUP_BUCKET}" ]; then
    log_info "Uploading backup to S3..."
    s3cmd put $BACKUP_FILE_GZ s3://${S3_BACKUP_BUCKET}/cronny/backups/
    log_success "Backup uploaded to S3"
  fi

else
  log_error "Backup failed!"
  exit 1
fi

echo ""
