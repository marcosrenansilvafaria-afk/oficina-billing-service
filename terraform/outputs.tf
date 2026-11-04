output "table_orcamentos_name" {
  value = aws_dynamodb_table.orcamentos.name
}

output "table_pagamentos_name" {
  value = aws_dynamodb_table.pagamentos.name
}

output "table_webhook_logs_name" {
  value = aws_dynamodb_table.webhook_logs.name
}

output "dynamodb_policy_arn" {
  description = "ARN da policy a ser anexada na IAM Role de GitHub Actions deste repositório."
  value       = aws_iam_policy.dynamodb_management.arn
}
