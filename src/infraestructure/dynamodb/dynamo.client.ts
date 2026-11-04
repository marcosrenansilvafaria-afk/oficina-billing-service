import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * Cliente DynamoDB singleton. `DYNAMODB_ENDPOINT` aponta para o
 * `amazon/dynamodb-local` no docker-compose local; sem essa variavel,
 * usa o DynamoDB real da AWS (regiao `AWS_REGION`).
 */
const baseClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT
    ? {
        endpoint: process.env.DYNAMODB_ENDPOINT,
        credentials: {
          accessKeyId: 'local',
          secretAccessKey: 'local',
        },
      }
    : {}),
});

export const dynamoDocClient = DynamoDBDocumentClient.from(baseClient);
export const dynamoClient = baseClient;

export const TABLE_NAMES = {
  orcamentos: process.env.DYNAMODB_TABLE_ORCAMENTOS || 'billing-orcamentos',
  pagamentos: process.env.DYNAMODB_TABLE_PAGAMENTOS || 'billing-pagamentos',
  webhookLogs:
    process.env.DYNAMODB_TABLE_WEBHOOK_LOGS || 'billing-webhook-logs',
};
