import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Orcamento } from '../../domain/entities/orcamento';
import { IOrcamentoRepository } from '../../domain/repositories/orcamento-repository.interface';
import { dynamoDocClient, TABLE_NAMES } from './dynamo.client';

export class DynamoOrcamentoRepository implements IOrcamentoRepository {
  async save(orcamento: Orcamento): Promise<void> {
    await dynamoDocClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.orcamentos,
        Item: {
          id: orcamento.id,
          ordemServicoId: orcamento.ordemServicoId,
          valorTotal: orcamento.valorTotal,
          itens: orcamento.itens,
          recebidoEm: orcamento.recebidoEm.toISOString(),
        },
      }),
    );
  }

  async getById(id: string): Promise<Orcamento | null> {
    const result = await dynamoDocClient.send(
      new GetCommand({ TableName: TABLE_NAMES.orcamentos, Key: { id } }),
    );
    if (!result.Item) return null;
    return this.toDomain(result.Item);
  }

  async getByOrdemServicoId(ordemServicoId: string): Promise<Orcamento | null> {
    const result = await dynamoDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.orcamentos,
        IndexName: 'ordemServicoId-index',
        KeyConditionExpression: 'ordemServicoId = :ordemServicoId',
        ExpressionAttributeValues: { ':ordemServicoId': ordemServicoId },
        Limit: 1,
      }),
    );
    const item = result.Items?.[0];
    return item ? this.toDomain(item) : null;
  }

  clear(): Promise<void> {
    return Promise.reject(
      new Error('clear() nao e suportado pelo repositorio DynamoDB real'),
    );
  }

  private toDomain(item: Record<string, unknown>): Orcamento {
    return new Orcamento(
      item.id as string,
      item.ordemServicoId as string,
      item.valorTotal as number,
      item.itens as Orcamento['itens'],
      new Date(item.recebidoEm as string),
    );
  }
}
