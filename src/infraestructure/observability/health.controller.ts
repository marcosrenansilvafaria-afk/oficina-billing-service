import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { dynamoClient } from '../dynamodb/dynamo.client';

@ApiExcludeController()
@Controller()
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get('health')
  @HealthCheck()
  check() {
    return this.health.check([() => this.checkDynamoDb()]);
  }

  private async checkDynamoDb(): Promise<HealthIndicatorResult> {
    const key = 'dynamodb';
    try {
      await dynamoClient.send(new ListTablesCommand({ Limit: 1 }));
      return { [key]: { status: 'up' } };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HealthCheckError('DynamoDB check failed', {
        [key]: { status: 'down', message },
      });
    }
  }
}
