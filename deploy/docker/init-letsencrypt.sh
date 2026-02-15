#!/bin/bash

# Initialize Let's Encrypt SSL certificates for Cronny
# This script should be run once during initial deployment

set -e

# Configuration
DOMAIN="cronny.app"
EMAIL="${CERTBOT_EMAIL:-admin@cronny.app}"
STAGING=${STAGING:-0} # Set to 1 for testing
RSA_KEY_SIZE=4096
DATA_PATH="./nginx/certbot"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Let's Encrypt SSL Initialization${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Staging mode: $STAGING"
echo ""

# Check if certificates already exist
if [ -d "$DATA_PATH/conf/live/$DOMAIN" ]; then
  echo -e "${YELLOW}Warning: Existing certificates found!${NC}"
  read -p "Do you want to replace them? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
  echo "Removing existing certificates..."
  docker compose -f $COMPOSE_FILE run --rm --entrypoint "\
    rm -rf /etc/letsencrypt/live/$DOMAIN && \
    rm -rf /etc/letsencrypt/archive/$DOMAIN && \
    rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot
fi

# Create directories
echo "Creating directories..."
mkdir -p "$DATA_PATH/conf"
mkdir -p "$DATA_PATH/www"

# Download recommended TLS parameters
echo "Downloading recommended TLS parameters..."
if [ ! -e "$DATA_PATH/conf/options-ssl-nginx.conf" ] || [ ! -e "$DATA_PATH/conf/ssl-dhparams.pem" ]; then
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$DATA_PATH/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$DATA_PATH/conf/ssl-dhparams.pem"
fi

# Create dummy certificate for initial nginx startup
echo "Creating dummy certificate for $DOMAIN..."
mkdir -p "$DATA_PATH/conf/live/$DOMAIN"
docker compose -f $COMPOSE_FILE run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
    -keyout '/etc/letsencrypt/live/$DOMAIN/privkey.pem' \
    -out '/etc/letsencrypt/live/$DOMAIN/fullchain.pem' \
    -subj '/CN=localhost'" certbot

# Create empty chain file
touch "$DATA_PATH/conf/live/$DOMAIN/chain.pem"

# Start nginx with dummy certificate
echo "Starting nginx..."
docker compose -f $COMPOSE_FILE up -d nginx

# Wait for nginx to be ready
echo "Waiting for nginx to be ready..."
sleep 5

# Delete dummy certificate
echo "Deleting dummy certificate..."
docker compose -f $COMPOSE_FILE run --rm --entrypoint "\
  rm -rf /etc/letsencrypt/live/$DOMAIN && \
  rm -rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

# Request real certificate
echo "Requesting Let's Encrypt certificate for $DOMAIN..."

# Determine if we should use staging or production
STAGING_ARG=""
if [ $STAGING != "0" ]; then
  STAGING_ARG="--staging"
  echo -e "${YELLOW}Using Let's Encrypt staging server (test mode)${NC}"
fi

# Request certificate
docker compose -f $COMPOSE_FILE run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

# Reload nginx to use new certificate
echo "Reloading nginx..."
docker compose -f $COMPOSE_FILE exec nginx nginx -s reload

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}SSL Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Your site should now be accessible at:"
echo "  https://$DOMAIN"
echo "  https://www.$DOMAIN"
echo ""
echo "Certificate will auto-renew every 12 hours via the certbot container."
echo ""
