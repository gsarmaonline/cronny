FROM nginx:alpine

# Install certbot dependencies
RUN apk add --no-cache \
    bash \
    openssl \
    curl

# Create directories for SSL certificates
RUN mkdir -p /etc/nginx/ssl /var/www/certbot

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
