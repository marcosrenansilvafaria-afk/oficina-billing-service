# Backend remoto (S3 + DynamoDB lock) - reaproveita o MESMO bucket e tabela
# de lock dos demais repositorios da Fase 3/4, com uma "key" propria.
terraform {
  backend "s3" {
    key            = "oficina-billing/terraform.tfstate"
    encrypt        = true
    dynamodb_table = "oficina-db-terraform-locks"
  }
}
