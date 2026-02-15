# Cronny Terraform Configuration

Terraform configuration for provisioning DigitalOcean infrastructure for Cronny.

## Overview

This Terraform configuration creates:

- **Droplet**: Ubuntu 22.04 server with configurable size
- **Block Storage Volume**: Persistent storage for PostgreSQL database
- **Firewall**: Security rules for SSH, HTTP, and HTTPS
- **DNS Records**: A record for domain, CNAME for www
- **SSH Key**: Automated SSH key management
- **Monitoring**: Optional CPU and memory alerts
- **Project**: Organized DigitalOcean project

## Prerequisites

1. **Terraform** installed (>= 1.0)
   ```bash
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **DigitalOcean Account** with API access

3. **DigitalOcean API Token**
   - Go to https://cloud.digitalocean.com/account/api/tokens
   - Click "Generate New Token"
   - Name: "Cronny Terraform"
   - Scopes: Read & Write
   - Save the token securely

4. **SSH Key Pair**
   ```bash
   # Generate if you don't have one
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
   ```

5. **Domain Name** (example.com)
   - Added to DigitalOcean: Networking → Domains → Add Domain
   - Or DNS managed externally (update NS records)

## Quick Start

### 1. Configure Variables

```bash
cd deploy/terraform

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit configuration
vim terraform.tfvars
```

**Required variables:**
```hcl
do_token = "dop_v1_xxxxxxxxxxxxxxxxxxxx"  # Your DO API token
domain_name = "example.com"
alert_email = "admin@example.com"
```

### 2. Initialize Terraform

```bash
terraform init
```

This downloads the DigitalOcean provider and initializes the backend.

### 3. Plan Infrastructure

```bash
terraform plan
```

Review the planned changes. You should see:
- 1 droplet
- 1 volume
- 1 volume attachment
- 1 firewall
- 2 DNS records (A and CNAME)
- 1 SSH key
- 1 project
- 2 monitoring alerts (if email provided)

### 4. Create Infrastructure

```bash
terraform apply
```

Type `yes` to confirm. This takes ~2-3 minutes.

### 5. Save Outputs

```bash
# View all outputs
terraform output

# Save specific outputs
terraform output -raw droplet_ip > ../droplet_ip.txt
terraform output -raw ssh_connection
```

## Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `do_token` | DigitalOcean API token | `dop_v1_xxx...` |

### Optional Variables

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `environment` | Environment name | `production` | `production`, `staging`, `testing` |
| `project_name` | Project name | `cronny` | Any string |
| `region` | DO region | `nyc3` | `nyc3`, `sfo3`, `lon1`, `sgp1`, etc. |
| `droplet_size` | Droplet size | `s-2vcpu-2gb` | See sizes below |
| `domain_name` | Domain name | `example.com` | Your domain |
| `ssh_public_key_path` | SSH key path | `~/.ssh/id_rsa.pub` | Path to public key |
| `volume_size` | Volume size in GB | `10` | 1-16384 |
| `enable_backups` | Enable backups | `true` | `true`, `false` |
| `alert_email` | Alert email | `""` | Email address |

### Droplet Sizes

| Size | vCPUs | RAM | SSD | Transfer | Price/Month |
|------|-------|-----|-----|----------|-------------|
| `s-1vcpu-1gb` | 1 | 1GB | 25GB | 1TB | $6 |
| `s-2vcpu-2gb` | 2 | 2GB | 60GB | 2TB | $12 ⭐ |
| `s-2vcpu-4gb` | 2 | 4GB | 80GB | 3TB | $24 |
| `s-4vcpu-8gb` | 4 | 8GB | 160GB | 4TB | $48 |

⭐ Recommended for production

### DigitalOcean Regions

| Region | Location | Code |
|--------|----------|------|
| New York 3 | USA, East Coast | `nyc3` ⭐ |
| San Francisco 3 | USA, West Coast | `sfo3` |
| London 1 | UK | `lon1` |
| Frankfurt 1 | Germany | `fra1` |
| Singapore 1 | Singapore | `sgp1` |
| Bangalore 1 | India | `blr1` |
| Toronto 1 | Canada | `tor1` |

⭐ Default

## Outputs

| Output | Description | Example |
|--------|-------------|---------|
| `droplet_id` | Droplet ID | `123456789` |
| `droplet_ip` | Public IP address | `157.230.123.45` |
| `droplet_name` | Droplet name | `cronny-production` |
| `volume_id` | Volume ID | `987654321` |
| `volume_path` | Mount path | `/mnt/cronny-production-db-volume` |
| `domain_fqdn` | Domain FQDN | `example.com` |
| `ssh_connection` | SSH command | `ssh root@157.230.123.45` |
| `next_steps` | Next steps | Instructions |

## Multi-Environment Setup

Terraform workspaces allow managing multiple environments:

### Create Staging Environment

```bash
# Create staging workspace
terraform workspace new staging

# Create staging variables file
cp terraform.tfvars terraform.tfvars.staging
vim terraform.tfvars.staging  # Set environment = "staging"

# Apply staging infrastructure
terraform apply -var-file=terraform.tfvars.staging
```

### Manage Environments

```bash
# List workspaces
terraform workspace list

# Switch to production
terraform workspace select production

# Switch to staging
terraform workspace select staging

# Show current workspace
terraform workspace show
```

### Workspace-Specific Resources

| Environment | Droplet Name | Domain | Volume |
|------------|--------------|--------|---------|
| Production | `cronny-production` | `example.com` | `/mnt/cronny-production-db-volume` |
| Staging | `cronny-staging` | `staging.example.com` | `/mnt/cronny-staging-db-volume` |
| Testing | `cronny-testing` | `testing.example.com` | `/mnt/cronny-testing-db-volume` |

## Cloud-Init

The `cloud-init.yml` file runs automatically on droplet creation:

**Actions performed:**
- System package updates
- Install Docker and Docker Compose
- Configure UFW firewall
- Setup fail2ban for SSH protection
- Create swap file (2GB)
- Create deployment user
- Configure system limits
- Create application directory

**Customization:**
Edit `cloud-init.yml` to add:
- Additional packages
- Custom users
- Environment-specific configuration
- Initialization scripts

## Advanced Usage

### Remote State

For team collaboration, use remote state:

1. **Create S3 bucket or DO Spaces:**
   ```bash
   # Using DigitalOcean Spaces
   doctl spaces create cronny-terraform-state --region nyc3
   ```

2. **Update main.tf backend configuration:**
   ```hcl
   terraform {
     backend "s3" {
       bucket = "cronny-terraform-state"
       key    = "production/terraform.tfstate"
       region = "nyc3"
       endpoint = "nyc3.digitaloceanspaces.com"
       skip_credentials_validation = true
       skip_metadata_api_check = true
     }
   }
   ```

3. **Initialize with backend:**
   ```bash
   terraform init -backend-config="access_key=YOUR_SPACES_KEY" \
                  -backend-config="secret_key=YOUR_SPACES_SECRET"
   ```

### Importing Existing Resources

If you have existing DigitalOcean resources:

```bash
# Import droplet
terraform import digitalocean_droplet.app 123456789

# Import volume
terraform import digitalocean_volume.db_data 987654321

# Import firewall
terraform import digitalocean_firewall.app abc123def456
```

### Scaling

**Resize droplet:**
```bash
# Update terraform.tfvars
droplet_size = "s-2vcpu-4gb"

# Apply changes
terraform apply

# SSH into droplet and restart services
ssh deploy@YOUR_IP
cd /opt/cronny/deploy/scripts
./deploy.sh
```

**Increase volume size:**
```bash
# Update terraform.tfvars
volume_size = 20

# Apply changes
terraform apply

# Resize filesystem on droplet
ssh root@YOUR_IP
resize2fs /dev/disk/by-id/scsi-0DO_Volume_cronny-production-db-volume
```

## Maintenance

### Update Resources

```bash
# Pull latest Terraform configuration
git pull origin main

# Update provider
terraform init -upgrade

# Plan changes
terraform plan

# Apply updates
terraform apply
```

### Backup State

```bash
# Backup state file
cp terraform.tfstate terraform.tfstate.backup-$(date +%Y%m%d)

# Or use remote state with versioning
```

### Destroy Infrastructure

**⚠️ Warning: This deletes all resources!**

```bash
# Preview destruction
terraform plan -destroy

# Destroy all resources
terraform destroy

# Destroy specific resource
terraform destroy -target=digitalocean_droplet.app
```

**Before destroying:**
1. Backup database
2. Download important data
3. Update DNS if moving
4. Cancel any active subscriptions

## Troubleshooting

### Provider Authentication Failed

```bash
# Verify token
curl -X GET -H "Authorization: Bearer $DO_TOKEN" \
  "https://api.digitalocean.com/v2/account"

# Update token
export TF_VAR_do_token="your-new-token"
```

### SSH Key Error

```bash
# Verify key exists
ls -la ~/.ssh/id_rsa.pub

# Generate new key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/cronny_rsa

# Update variable
ssh_public_key_path = "~/.ssh/cronny_rsa.pub"
```

### Domain Not Found

```bash
# Check domain is added to DO
doctl compute domain list

# Add domain
doctl compute domain create example.com
```

### Volume Mount Issues

```bash
# SSH into droplet
ssh root@DROPLET_IP

# Check volume
lsblk
df -h

# Mount manually
mkdir -p /mnt/cronny-production-db-volume
mount /dev/disk/by-id/scsi-0DO_Volume_* /mnt/cronny-production-db-volume
```

### Terraform State Lock

```bash
# Force unlock (careful!)
terraform force-unlock LOCK_ID
```

## Security Considerations

1. **API Token**: Store securely, never commit to git
2. **SSH Keys**: Use strong keys, rotate periodically
3. **Firewall**: Only open necessary ports
4. **Backups**: Enable for critical environments
5. **Monitoring**: Set up alerts for anomalies
6. **State File**: Contains sensitive data, secure it

## Cost Management

```bash
# Estimate costs before apply
terraform plan

# Check current costs
doctl billing history

# Monitor usage
doctl compute droplet list
doctl compute volume list
```

**Monthly cost estimate:**
- Droplet (2GB): $12
- Volume (10GB): $1
- Backups: $1.20 (if enabled)
- Bandwidth: Free (2TB included)
- **Total: ~$14/month**

## Additional Resources

- [DigitalOcean Terraform Provider](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs)
- [Terraform Documentation](https://www.terraform.io/docs)
- [DigitalOcean API Docs](https://docs.digitalocean.com/reference/api/)
- [Cloud-Init Documentation](https://cloudinit.readthedocs.io/)

## Support

For issues specific to this Terraform configuration:
1. Check logs: `terraform show`
2. Validate configuration: `terraform validate`
3. Format code: `terraform fmt`
4. Create GitHub issue with error details
