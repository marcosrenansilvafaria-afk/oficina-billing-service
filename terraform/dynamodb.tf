# 3 tabelas exclusivas do Billing Service - requisito da Sprint 3: banco
# NoSQL dedicado, nenhum outro servico acessa diretamente. PAY_PER_REQUEST
# (serverless, sem custo ocioso) - mesma logica de custo do SNS/SQS ja
# usado no projeto.

resource "aws_dynamodb_table" "orcamentos" {
  name         = "billing-orcamentos"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "ordemServicoId"
    type = "S"
  }

  global_secondary_index {
    name            = "ordemServicoId-index"
    hash_key        = "ordemServicoId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "billing-orcamentos"
  }
}

resource "aws_dynamodb_table" "pagamentos" {
  name         = "billing-pagamentos"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "ordemServicoId"
    type = "S"
  }

  attribute {
    name = "mercadoPagoPaymentId"
    type = "S"
  }

  global_secondary_index {
    name            = "ordemServicoId-index"
    hash_key        = "ordemServicoId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "mercadoPagoPaymentId-index"
    hash_key        = "mercadoPagoPaymentId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "billing-pagamentos"
  }
}

resource "aws_dynamodb_table" "webhook_logs" {
  name         = "billing-webhook-logs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "billing-webhook-logs"
  }
}
