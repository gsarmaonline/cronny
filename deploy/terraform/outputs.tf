output "droplet_id" {
  description = "ID of the created droplet"
  value       = digitalocean_droplet.app.id
}

output "droplet_ip" {
  description = "Public IP address of the droplet"
  value       = digitalocean_droplet.app.ipv4_address
}

output "droplet_name" {
  description = "Name of the droplet"
  value       = digitalocean_droplet.app.name
}

output "volume_id" {
  description = "ID of the database volume"
  value       = digitalocean_volume.db_data.id
}

output "volume_path" {
  description = "Mount path for the volume"
  value       = "/mnt/${digitalocean_volume.db_data.name}"
}

output "domain_fqdn" {
  description = "Fully qualified domain name"
  value       = var.environment == "production" ? var.domain_name : "${var.environment}.${var.domain_name}"
}

output "dns_record" {
  description = "DNS A record"
  value       = digitalocean_record.app.fqdn
}

output "ssh_connection" {
  description = "SSH connection command"
  value       = "ssh root@${digitalocean_droplet.app.ipv4_address}"
}

output "next_steps" {
  description = "Next steps after infrastructure is created"
  value       = <<-EOT
    Infrastructure created successfully!

    Next steps:
    1. SSH into the server: ssh root@${digitalocean_droplet.app.ipv4_address}
    2. Run the setup script: cd /root && ./setup-droplet.sh
    3. Configure DNS: Point ${var.environment == "production" ? var.domain_name : "${var.environment}.${var.domain_name}"} to ${digitalocean_droplet.app.ipv4_address}
    4. Deploy the application: ./deploy.sh

    Volume mount: /mnt/${digitalocean_volume.db_data.name}
  EOT
}
