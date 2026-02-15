variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name (production, staging, testing)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "testing"], var.environment)
    error_message = "Environment must be one of: production, staging, testing"
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "cronny"
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}

variable "droplet_size" {
  description = "Droplet size"
  type        = string
  default     = "s-2vcpu-2gb" # 2GB RAM, $12/month
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "cronny.app"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "volume_size" {
  description = "Size of the block storage volume in GB"
  type        = number
  default     = 10
}

variable "enable_backups" {
  description = "Enable automated droplet backups"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Email for monitoring alerts"
  type        = string
  default     = ""
}
