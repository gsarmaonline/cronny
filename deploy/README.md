# Cronny Deployment Guide

Complete deployment guide for deploying Cronny to DigitalOcean using Terraform, Docker Compose, and GitHub Actions.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Environment Management](#environment-management)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

## Overview

This deployment setup provides:

- **Infrastructure as Code**: Terraform configuration for DigitalOcean
- **Containerized Services**: All services running in Docker containers
- **HTTPS/SSL**: Automatic SSL certificate management with Let's Encrypt
- **CI/CD**: GitHub Actions for automated deployment
- **Database Backups**: Automated PostgreSQL backups
- **Environment Awareness**: Easy multi-environment support (production, staging, testing)

### Architecture

```
┌─────────────────────────────────────────────────┐
│           DigitalOcean Droplet (2GB)            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐    ┌──────────────────────┐     │
│  │  Nginx   │───▶│   Frontend (React)   │     │
│  │  (SSL)   │    └──────────────────────┘     │
│  │          │    ┌──────────────────────┐     │
│  │          │───▶│   API (Go/Gin)       │     │
│  └──────────┘    └──────────────────────┘     │
│                  ┌──────────────────────┐     │
│                  │  TriggerCreator      │     │
│                  │  (Background Worker) │     │
│                  └──────────────────────┘     │
│                  ┌──────────────────────┐     │
│                  │  TriggerExecutor     │     │
│                  │  (Background Worker) │     │
│                  └──────────────────────┘     │
│                  ┌──────────────────────┐     │
│                  │  PostgreSQL          │     │
│                  │  (Persistent Volume) │     │
│                  └──────────────────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
                    ▲
                    │ HTTPS (443)
                    │
              example.com
```

## Prerequisites

### Local Machine

- [Terraform](https://www.terraform.io/downloads) >= 1.0
- [DigitalOcean API Token](https://cloud.digitalocean.com/account/api/tokens)
- SSH key pair (`~/.ssh/id_rsa` or create new one)
- Git
- Domain name (example.com) with access to DNS settings

### DigitalOcean Account

- Active DigitalOcean account
- Domain added to DigitalOcean (or DNS managed externally)
- Sufficient credits (~$15/month for 2GB droplet + volume)

## Quick Start

### 1. Infrastructure Setup (5 minutes)

```bash
# Navigate to terraform directory
cd deploy/terraform

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars  # Add your DO_TOKEN and configure settings

# Initialize and apply Terraform
terraform init
terraform plan
terraform apply

# Note the droplet IP from output
```

### 2. Server Setup (10 minutes)

```bash
# SSH into the droplet (use IP from terraform output)
ssh root@YOUR_DROPLET_IP

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/gsarmaonline/cronny/main/deploy/scripts/setup-droplet.sh -o setup-droplet.sh
chmod +x setup-droplet.sh
./setup-droplet.sh

# Or if repo is already cloned
cd /opt/cronny/deploy/scripts
./setup-droplet.sh
```

### 3. Configure Environment (5 minutes)

```bash
# Switch to deploy user
su - deploy
cd /opt/cronny/deploy/docker

# Create production environment file
cp .env.example .env.production

# Edit environment variables
vim .env.production
# - Set DB_PASSWORD
# - Set JWT_SECRET (generate with: openssl rand -base64 32)
# - Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
# - Set CERTBOT_EMAIL
# - Verify DOMAIN_NAME=example.com
```

### 4. Deploy Application (5 minutes)

```bash
cd /opt/cronny/deploy/scripts
CRONNY_ENV=production ./deploy.sh
```

### 5. Setup SSL (5 minutes)

```bash
cd /opt/cronny/deploy/docker
./init-letsencrypt.sh
```

### 6. Setup GitHub Actions (5 minutes)

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `SSH_PRIVATE_KEY`: Your SSH private key
- `DROPLET_IP`: Your droplet IP address
- `DOMAIN_NAME`: example.com

See [GITHUB_SECRETS.md](./GITHUB_SECRETS.md) for detailed instructions.

## Detailed Setup

### Infrastructure Provisioning

See [terraform/README.md](./terraform/README.md) for detailed Terraform documentation.

**Key components:**
- Droplet (Ubuntu 22.04, 2GB RAM)
- Block storage volume (10GB for database)
- Firewall (SSH, HTTP, HTTPS)
- DNS A record for example.com

### Environment Configuration

Environment variables are managed per environment:

```
deploy/docker/
├── .env.production   # Production configuration
├── .env.staging      # Staging configuration (future)
├── .env.example      # Template
```

**Critical variables to configure:**

```bash
# Database
DB_PASSWORD=strong_random_password

# Authentication
JWT_SECRET=generate_with_openssl_rand_base64_32
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_secret

# SSL
CERTBOT_EMAIL=admin@example.com

# URLs
DOMAIN_NAME=example.com
FRONTEND_URL=https://example.com
API_URL=https://example.com/api
```

### SSL Certificate Setup

The `init-letsencrypt.sh` script:
1. Creates a dummy certificate for initial nginx startup
2. Requests real certificates from Let's Encrypt
3. Configures automatic renewal (runs every 12 hours)

**Staging mode (for testing):**
```bash
STAGING=1 ./init-letsencrypt.sh
```

## Environment Management

### Adding Staging Environment

1. **Update Terraform:**
   ```bash
   cd deploy/terraform
   cp terraform.tfvars terraform.tfvars.staging
   vim terraform.tfvars.staging  # Set environment = "staging"
   terraform workspace new staging
   terraform apply -var-file=terraform.tfvars.staging
   ```

2. **Configure staging environment:**
   ```bash
   ssh deploy@STAGING_DROPLET_IP
   cd /opt/cronny/deploy/docker
   cp .env.example .env.staging
   vim .env.staging  # Configure staging-specific values
   ```

3. **Deploy to staging:**
   ```bash
   CRONNY_ENV=staging ./deploy.sh
   ```

4. **DNS:**
   - Production: `example.com` → Production IP
   - Staging: `staging.example.com` → Staging IP

### Environment Variables by Environment

| Variable | Production | Staging | Testing |
|----------|-----------|---------|---------|
| CRONNY_ENV | production | staging | testing |
| DOMAIN_NAME | example.com | staging.example.com | testing.example.com |
| DB_NAME | cronny_production | cronny_staging | cronny_testing |

## Maintenance

### Viewing Logs

```bash
cd /opt/cronny/deploy/docker

# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f triggercreator
docker compose -f docker-compose.prod.yml logs -f triggerexecutor
docker compose -f docker-compose.prod.yml logs -f postgres
```

### Database Backup

**Manual backup:**
```bash
cd /opt/cronny/deploy/scripts
./backup.sh
```

**Automatic backups:**
- Created before each deployment
- Retained for 7 days (configurable with `BACKUP_RETENTION_DAYS`)
- Stored in `/opt/cronny/deploy/docker/backups/`

**Restore from backup:**
```bash
cd /opt/cronny/deploy/scripts
./rollback.sh -l  # List available backups
./rollback.sh -b backup_file.sql.gz
```

### Manual Deployment

```bash
ssh deploy@YOUR_DROPLET_IP
cd /opt/cronny/deploy/scripts
CRONNY_ENV=production ./deploy.sh
```

### Rollback

**Rollback to previous commit:**
```bash
cd /opt/cronny/deploy/scripts
./rollback.sh -p
```

**Rollback to specific commit:**
```bash
./rollback.sh -c abc123
```

**Restore database only:**
```bash
./rollback.sh -b /path/to/backup.sql.gz
```

### Updating Services

**Update only API:**
```bash
cd /opt/cronny/deploy/docker
docker compose -f docker-compose.prod.yml up -d --no-deps --build api
```

**Update all services:**
```bash
cd /opt/cronny/deploy/scripts
./deploy.sh
```

### SSL Certificate Renewal

Certificates auto-renew via the certbot container. To manually renew:

```bash
cd /opt/cronny/deploy/docker
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Troubleshooting

### Services Not Starting

**Check service status:**
```bash
docker compose -f docker-compose.prod.yml ps
```

**Check logs:**
```bash
docker compose -f docker-compose.prod.yml logs api
```

**Restart services:**
```bash
docker compose -f docker-compose.prod.yml restart
```

### Database Connection Issues

**Check postgres is running:**
```bash
docker compose -f docker-compose.prod.yml ps postgres
```

**Test database connection:**
```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U cronny -d cronny_production
```

**Check environment variables:**
```bash
docker compose -f docker-compose.prod.yml exec api env | grep DB_
```

### SSL Certificate Issues

**Check certificate status:**
```bash
cd /opt/cronny/deploy/docker
docker compose -f docker-compose.prod.yml exec certbot certbot certificates
```

**Reinitialize certificates:**
```bash
./init-letsencrypt.sh
```

**Check nginx configuration:**
```bash
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

### GitHub Actions Deployment Failures

**Check logs:**
- Go to GitHub → Actions → Failed workflow
- Review each step's logs

**Common issues:**
- SSH connection failed: Verify `SSH_PRIVATE_KEY` and `DROPLET_IP` secrets
- Health check failed: Check service logs on the droplet
- Permission denied: Verify deploy user has proper permissions

**Manual verification:**
```bash
# Test from local machine
ssh deploy@YOUR_DROPLET_IP "cd /opt/cronny && git pull"
```

### High Memory Usage

**Check memory:**
```bash
free -h
docker stats
```

**Restart services to free memory:**
```bash
docker compose -f docker-compose.prod.yml restart
```

**Upgrade droplet size:**
```bash
cd deploy/terraform
vim terraform.tfvars  # Change droplet_size to "s-2vcpu-4gb"
terraform apply
```

## Performance Optimization

### Database Optimization

```bash
# Vacuum database
docker compose -f docker-compose.prod.yml exec postgres psql -U cronny -d cronny_production -c "VACUUM ANALYZE;"
```

### Docker Image Cleanup

```bash
# Remove unused images
docker image prune -a -f

# Remove unused volumes (careful!)
docker volume prune -f
```

### Monitoring

Install monitoring tools:
```bash
# Install ctop for container monitoring
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop
ctop
```

## Security Best Practices

1. **SSH Keys**: Use SSH keys only, disable password authentication
2. **Firewall**: Only open necessary ports (22, 80, 443)
3. **Updates**: Keep system packages updated
4. **Secrets**: Never commit `.env` files or secrets to git
5. **Backups**: Maintain regular database backups
6. **SSL**: Keep SSL certificates up to date
7. **Monitoring**: Set up alerts for resource usage

## Cost Breakdown

| Resource | Specification | Cost/Month |
|----------|--------------|------------|
| Droplet | 2GB RAM, 2 vCPUs | $12 |
| Volume | 10GB Block Storage | $1 |
| Backups | Optional | $1.20 |
| Bandwidth | 2TB included | $0 |
| **Total** | | **~$14/month** |

## Support

- **Documentation**: See individual README files in subdirectories
- **Issues**: Create an issue on GitHub
- **Terraform**: [terraform/README.md](./terraform/README.md)
- **GitHub Secrets**: [GITHUB_SECRETS.md](./GITHUB_SECRETS.md)

## License

Same as Cronny project license.
