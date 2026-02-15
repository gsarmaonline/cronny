terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }

  # Optional: Use remote state (uncomment and configure for team collaboration)
  # backend "s3" {
  #   bucket = "cronny-terraform-state"
  #   key    = "production/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "digitalocean" {
  token = var.do_token
}

# SSH Key for droplet access
resource "digitalocean_ssh_key" "default" {
  name       = "${var.project_name}-${var.environment}-key"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

# Droplet for the application
resource "digitalocean_droplet" "app" {
  name       = "${var.project_name}-${var.environment}"
  image      = "ubuntu-22-04-x64"
  region     = var.region
  size       = var.droplet_size
  backups    = var.enable_backups
  monitoring = true

  ssh_keys = [
    digitalocean_ssh_key.default.id
  ]

  tags = [
    var.environment,
    var.project_name,
    "managed-by-terraform"
  ]

  # User data script for initial setup
  user_data = templatefile("${path.module}/cloud-init.yml", {
    environment = var.environment
  })
}

# Block storage volume for database persistence
resource "digitalocean_volume" "db_data" {
  region                  = var.region
  name                    = "${var.project_name}-${var.environment}-db-volume"
  size                    = var.volume_size
  initial_filesystem_type = "ext4"
  description            = "Database volume for ${var.project_name} ${var.environment}"

  tags = [
    var.environment,
    var.project_name,
    "database"
  ]
}

# Attach volume to droplet
resource "digitalocean_volume_attachment" "db_data" {
  droplet_id = digitalocean_droplet.app.id
  volume_id  = digitalocean_volume.db_data.id
}

# Firewall rules
resource "digitalocean_firewall" "app" {
  name = "${var.project_name}-${var.environment}-firewall"

  droplet_ids = [digitalocean_droplet.app.id]

  # SSH access
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Allow all outbound traffic
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  tags = [
    var.environment,
    var.project_name
  ]
}

# DNS A record for the domain
resource "digitalocean_record" "app" {
  domain = var.domain_name
  type   = "A"
  name   = var.environment == "production" ? "@" : var.environment
  value  = digitalocean_droplet.app.ipv4_address
  ttl    = 300
}

# DNS CNAME for www (production only)
resource "digitalocean_record" "www" {
  count  = var.environment == "production" ? 1 : 0
  domain = var.domain_name
  type   = "CNAME"
  name   = "www"
  value  = "@"
  ttl    = 300
}

# Project to organize resources
resource "digitalocean_project" "cronny" {
  name        = "${var.project_name}-${var.environment}"
  description = "Cronny application - ${var.environment} environment"
  purpose     = "Web Application"
  environment = title(var.environment)

  resources = [
    digitalocean_droplet.app.urn,
    digitalocean_volume.db_data.urn
  ]
}

# Optional: Monitoring alert for high CPU usage
resource "digitalocean_monitor_alert" "high_cpu" {
  count = var.alert_email != "" ? 1 : 0

  alerts {
    email = [var.alert_email]
  }

  window      = "5m"
  type        = "v1/insights/droplet/cpu"
  compare     = "GreaterThan"
  value       = 80
  enabled     = true
  entities    = [digitalocean_droplet.app.id]
  description = "Alert when CPU exceeds 80%"
}

# Optional: Monitoring alert for high memory usage
resource "digitalocean_monitor_alert" "high_memory" {
  count = var.alert_email != "" ? 1 : 0

  alerts {
    email = [var.alert_email]
  }

  window      = "5m"
  type        = "v1/insights/droplet/memory_utilization_percent"
  compare     = "GreaterThan"
  value       = 85
  enabled     = true
  entities    = [digitalocean_droplet.app.id]
  description = "Alert when memory exceeds 85%"
}
