output "master_public_ip" {
  description = "Public IP of master node"
  value       = aws_instance.master.public_ip
}

output "worker_public_ip" {
  description = "Public IP of worker node"
  value       = aws_instance.worker.public_ip
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.stockshelf_sg.id
}
