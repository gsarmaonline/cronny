#!/bin/sh
set -e

# Substitute environment variables in nginx config template
echo "Substituting environment variables in nginx configuration..."
envsubst '${DOMAIN_NAME}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Nginx configuration generated for domain: ${DOMAIN_NAME}"

# Execute the original nginx command
exec "$@"
