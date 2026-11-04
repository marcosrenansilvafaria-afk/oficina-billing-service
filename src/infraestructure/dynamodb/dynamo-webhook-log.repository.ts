import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { WebhookLog } from '../../domain/entities/webhook-log';
import { IWebhookLogRepository } from '../../domain/repositories/webhook-log-repository.interface';
import { dynamoDocClient, TABLE_NAMES } from './dynamo.client';

export class DynamoWebhookLogRepository implements IWebhookLogRepository {
  async save(log: WebhookLog): Promise<void> {
    await dynamoDocClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.webhookLogs,
        Item: {
          id: log.id,
          tipo: log.tipo,
          payloadBruto: log.payloadBruto,
          processadoComSucesso: log.processadoComSucesso,
          erro: log.erro,
          recebidoEm: log.recebidoEm.toISOString(),
        },
      }),
    );
  }

  clear(): Promise<void> {
    return Promise.reject(
      new Error('clear() nao e suportado pelo repositorio DynamoDB real'),
    );
  }
}
