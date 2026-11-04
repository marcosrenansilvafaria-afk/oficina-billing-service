#!/bin/sh
set -e

# DynamoDB nao tem schema/migrations - nada a aguardar alem do processo
# subir. As tabelas ja existem (Terraform, ver terraform/) ou, localmente,
# sao criadas pelo amazon/dynamodb-local no docker-compose.
echo "[entrypoint] Iniciando API..."
exec node dist/main.js
