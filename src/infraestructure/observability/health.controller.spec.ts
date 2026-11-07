import { HealthCheckService, HealthCheckError } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { dynamoClient } from '../dynamodb/dynamo.client';

describe('HealthController', () => {
  function buildHealthMock() {
    return {
      check: jest.fn((indicators: Array<() => unknown>) =>
        Promise.all(indicators.map((fn) => fn())),
      ),
    };
  }

  it('reporta "up" quando o DynamoDB responde ao ListTablesCommand', async () => {
    jest.spyOn(dynamoClient, 'send').mockResolvedValue({} as never);
    const health = buildHealthMock();
    const controller = new HealthController(
      health as unknown as HealthCheckService,
    );

    const result = await controller.check();

    expect(result).toEqual([{ dynamodb: { status: 'up' } }]);
  });

  it('propaga HealthCheckError quando o DynamoDB falha', async () => {
    jest
      .spyOn(dynamoClient, 'send')
      .mockRejectedValue(new Error('conexao recusada'));
    const health = buildHealthMock();
    const controller = new HealthController(
      health as unknown as HealthCheckService,
    );

    await expect(controller.check()).rejects.toBeInstanceOf(HealthCheckError);
  });
});
