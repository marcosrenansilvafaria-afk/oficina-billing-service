import { DynamoWebhookLogRepository } from './dynamo-webhook-log.repository';
import { WebhookLog } from '../../domain/entities/webhook-log';
import { dynamoDocClient } from './dynamo.client';

describe('DynamoWebhookLogRepository', () => {
  afterEach(() => jest.restoreAllMocks());

  it('save() grava o log no DynamoDB com os campos corretos', async () => {
    const sendSpy = jest
      .spyOn(dynamoDocClient, 'send')
      .mockResolvedValue({} as never);
    const repo = new DynamoWebhookLogRepository();
    const log = new WebhookLog('log-1', 'payment', '{}', true);

    await repo.save(log);

    const command = sendSpy.mock.calls[0][0] as {
      input: { Item: { id: string } };
    };
    expect(command.input.Item.id).toBe('log-1');
  });

  it('clear() rejeita - nao suportado no DynamoDB real', async () => {
    const repo = new DynamoWebhookLogRepository();

    await expect(repo.clear()).rejects.toThrow(
      'clear() nao e suportado pelo repositorio DynamoDB real',
    );
  });
});
