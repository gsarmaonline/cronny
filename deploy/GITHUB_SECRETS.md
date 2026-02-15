# GitHub Secrets Configuration

This document lists all the secrets required for the GitHub Actions CI/CD workflow.

## Required Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

### 1. SSH_PRIVATE_KEY
Your SSH private key for accessing the DigitalOcean droplet.

**How to get it:**
```bash
# Generate a new SSH key pair (if you don't have one)
ssh-keygen -t rsa -b 4096 -C "github-actions@example.com" -f ~/.ssh/cronny_deploy

# Copy the private key content
cat ~/.ssh/cronny_deploy

# Add the public key to the droplet
ssh-copy-id -i ~/.ssh/cronny_deploy.pub root@YOUR_DROPLET_IP
```

**Value:** The entire content of your private key file (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)

### 2. DROPLET_IP
The public IP address of your DigitalOcean droplet.

**How to get it:**
```bash
# From Terraform output
cd deploy/terraform
terraform output droplet_ip

# Or from DigitalOcean console
# Dashboard → Droplets → Your droplet → Copy IP address
```

**Value:** Example: `157.230.123.456`

### 3. DOMAIN_NAME
Your domain name for the application.

**Value:** `example.com`

## Optional Secrets

### SLACK_WEBHOOK_URL (Optional)
Webhook URL for sending deployment notifications to Slack.

**How to get it:**
1. Go to https://api.slack.com/apps
2. Create a new app or select existing app
3. Enable Incoming Webhooks
4. Add New Webhook to Workspace
5. Copy the Webhook URL

**Value:** `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`

## Verifying Secrets

After adding secrets, verify they're set correctly:

1. Go to Settings → Secrets and variables → Actions
2. You should see:
   - ✅ SSH_PRIVATE_KEY
   - ✅ DROPLET_IP
   - ✅ DOMAIN_NAME

3. Test the workflow:
   ```bash
   # Trigger a manual deployment
   # Go to Actions → Deploy to Production → Run workflow
   ```

## Security Notes

- Never commit secrets to the repository
- Rotate SSH keys periodically
- Use different keys for different environments
- Enable 2FA on your GitHub account
- Limit SSH access to specific IP ranges in DigitalOcean firewall

## Troubleshooting

### SSH Connection Failed
```bash
# Test SSH connection manually
ssh -i ~/.ssh/cronny_deploy deploy@YOUR_DROPLET_IP

# Check if the deploy user exists
ssh root@YOUR_DROPLET_IP "id deploy"
```

### Permission Denied
- Ensure the SSH key has proper permissions (600)
- Verify the public key is in `~/.ssh/authorized_keys` on the droplet
- Check that the deploy user has sudo access

### Deployment Failed
- Check GitHub Actions logs for detailed error messages
- SSH into the droplet and check Docker logs
- Review deployment logs: `tail -f /opt/cronny/logs/deploy.log`
