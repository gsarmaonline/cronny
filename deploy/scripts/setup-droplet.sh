#!/bin/bash

# Cronny Droplet Setup Script
# This script sets up a fresh DigitalOcean droplet for Cronny deployment
# Run this ONCE after creating the droplet with Terraform

set -e

# Configuration
ENVIRONMENT="${CRONNY_ENV:-production}"
REPO_URL="https://github.com/gsarmaonline/cronny.git"
REPO_BRANCH="main"
DEPLOY_USER="deploy"
APP_DIR="/opt/cronny"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Cronny Droplet Setup${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "Environment: ${BLUE}${ENVIRONMENT}${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run as root${NC}"
  exit 1
fi

# Update system
echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install required packages
echo -e "${YELLOW}[2/10] Installing required packages...${NC}"
apt-get install -y \
  git \
  curl \
  wget \
  ufw \
  fail2ban \
  htop \
  vim \
  jq \
  make

# Configure firewall
echo -e "${YELLOW}[3/10] Configuring firewall...${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

# Setup fail2ban for SSH protection
echo -e "${YELLOW}[4/10] Configuring fail2ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban

# Install Docker (if not already installed via cloud-init)
echo -e "${YELLOW}[5/10] Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
  systemctl start docker
  systemctl enable docker
else
  echo "Docker already installed"
fi

# Install Docker Compose
echo -e "${YELLOW}[6/10] Installing Docker Compose...${NC}"
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create deployment user
echo -e "${YELLOW}[7/10] Setting up deployment user...${NC}"
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash -G docker,sudo $DEPLOY_USER
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$DEPLOY_USER
  echo "User $DEPLOY_USER created"
else
  echo "User $DEPLOY_USER already exists"
fi

# Setup application directory
echo -e "${YELLOW}[8/10] Setting up application directory...${NC}"
mkdir -p $APP_DIR
chown $DEPLOY_USER:$DEPLOY_USER $APP_DIR

# Clone repository
echo -e "${YELLOW}[9/10] Cloning repository...${NC}"
if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u $DEPLOY_USER git clone -b $REPO_BRANCH $REPO_URL $APP_DIR
  echo "Repository cloned to $APP_DIR"
else
  echo "Repository already exists at $APP_DIR"
  cd $APP_DIR
  sudo -u $DEPLOY_USER git fetch origin
  sudo -u $DEPLOY_USER git checkout $REPO_BRANCH
  sudo -u $DEPLOY_USER git pull origin $REPO_BRANCH
fi

# Setup database volume mount
echo -e "${YELLOW}[10/10] Setting up database volume...${NC}"
VOLUME_NAME=$(ls /dev/disk/by-id/ | grep -i do-volume || echo "")
if [ -n "$VOLUME_NAME" ]; then
  VOLUME_DEVICE="/dev/disk/by-id/$VOLUME_NAME"
  MOUNT_POINT="/mnt/cronny-${ENVIRONMENT}-db-volume"

  # Create mount point
  mkdir -p $MOUNT_POINT

  # Check if already mounted
  if ! grep -qs "$MOUNT_POINT" /proc/mounts; then
    # Format if not already formatted
    if ! blkid $VOLUME_DEVICE | grep -q ext4; then
      mkfs.ext4 -F $VOLUME_DEVICE
    fi

    # Mount
    mount -o discard,defaults $VOLUME_DEVICE $MOUNT_POINT

    # Add to fstab
    if ! grep -q "$VOLUME_DEVICE" /etc/fstab; then
      echo "$VOLUME_DEVICE $MOUNT_POINT ext4 defaults,nofail,discard 0 2" >> /etc/fstab
    fi

    echo "Volume mounted at $MOUNT_POINT"
  else
    echo "Volume already mounted"
  fi

  # Create postgres data directory
  mkdir -p $MOUNT_POINT/postgres
  chown -R 999:999 $MOUNT_POINT/postgres  # PostgreSQL container user
  chmod 700 $MOUNT_POINT/postgres
else
  echo -e "${RED}Warning: No DigitalOcean volume found. Database will use local storage.${NC}"
fi

# Create deployment directories
mkdir -p $APP_DIR/deploy/docker/nginx/certbot/{conf,www}
mkdir -p $APP_DIR/deploy/docker/nginx/ssl
mkdir -p $APP_DIR/deploy/docker/backups
mkdir -p $APP_DIR/logs

chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Copy .env file: ${YELLOW}cp $APP_DIR/deploy/docker/.env.example $APP_DIR/deploy/docker/.env.${ENVIRONMENT}${NC}"
echo -e "2. Edit environment variables: ${YELLOW}vim $APP_DIR/deploy/docker/.env.${ENVIRONMENT}${NC}"
echo -e "3. Deploy application: ${YELLOW}cd $APP_DIR/deploy/scripts && ./deploy.sh${NC}"
echo -e "4. Initialize SSL: ${YELLOW}cd $APP_DIR/deploy/docker && ./init-letsencrypt.sh${NC}"
echo ""
echo -e "Application directory: ${BLUE}$APP_DIR${NC}"
echo -e "Deploy user: ${BLUE}$DEPLOY_USER${NC}"
echo -e "Environment: ${BLUE}$ENVIRONMENT${NC}"
echo ""
