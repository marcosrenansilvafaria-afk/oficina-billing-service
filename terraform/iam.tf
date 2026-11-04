# Policy anexada a IAM Role de GitHub Actions deste repositorio
# (oficina-billing-service-github-actions, criada fora do Terraform, mesmo
# padrao OIDC da Fase 3/4) - permissoes de gerenciamento (DDL) das 3 tabelas
# exclusivas deste servico, necessarias para o `terraform apply`/`destroy`.
resource "aws_iam_policy" "dynamodb_management" {
  name        = "oficina-billing-dynamodb-policy"
  description = "Gerenciamento (DDL) das tabelas DynamoDB exclusivas do Billing Service."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDbTableManagement"
        Effect = "Allow"
        Action = [
          "dynamodb:CreateTable",
          "dynamodb:DeleteTable",
          "dynamodb:DescribeTable",
          "dynamodb:UpdateTable",
          "dynamodb:TagResource",
          "dynamodb:UntagResource",
          "dynamodb:ListTagsOfResource",
        ]
        Resource = [
          aws_dynamodb_table.orcamentos.arn,
          "${aws_dynamodb_table.orcamentos.arn}/index/*",
          aws_dynamodb_table.pagamentos.arn,
          "${aws_dynamodb_table.pagamentos.arn}/index/*",
          aws_dynamodb_table.webhook_logs.arn,
        ]
      },
      {
        Sid    = "DynamoDbItemAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
        ]
        Resource = [
          aws_dynamodb_table.orcamentos.arn,
          "${aws_dynamodb_table.orcamentos.arn}/index/*",
          aws_dynamodb_table.pagamentos.arn,
          "${aws_dynamodb_table.pagamentos.arn}/index/*",
          aws_dynamodb_table.webhook_logs.arn,
        ]
      },
    ]
  })

  tags = {
    Name = "oficina-billing-dynamodb-policy"
  }
}
