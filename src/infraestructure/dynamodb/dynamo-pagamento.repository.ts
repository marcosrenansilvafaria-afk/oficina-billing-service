import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Pagamento, StatusPagamento } from '../../domain/entities/pagamento';
import { IPagamentoRepository } from '../../domain/repositories/pagamento-repository.interface';
import { dynamoDocClient, TABLE_NAMES } from './dynamo.client';

export class DynamoPagamentoRepository implements IPagamentoRepository {
  async save(pagamento: Pagamento): Promise<void> {
    await dynamoDocClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.pagamentos,
        Item: {
          id: pagamento.id,
          ordemServicoId: pagamento.ordemServicoId,
          orcamentoId: pagamento.orcamentoId,
          valor: pagamento.valor,
          status: pagamento.getStatus(),
          mercadoPagoPaymentId: pagamento.getMercadoPagoPaymentId(),
          mercadoPagoPreferenceId: pagamento.getMercadoPagoPreferenceId(),
          motivoRecusa: pagamento.getMotivoRecusa(),
          criadoEm: pagamento.criadoEm.toISOString(),
          atualizadoEm: pagamento.getAtualizadoEm().toISOString(),
        },
      }),
    );
  }

  async getById(id: string): Promise<Pagamento | null> {
    const result = await dynamoDocClient.send(
      new GetCommand({ TableName: TABLE_NAMES.pagamentos, Key: { id } }),
    );
    return result.Item ? this.toDomain(result.Item) : null;
  }

  async getByOrdemServicoId(ordemServicoId: string): Promise<Pagamento | null> {
    const result = await dynamoDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.pagamentos,
        IndexName: 'ordemServicoId-index',
        KeyConditionExpression: 'ordemServicoId = :ordemServicoId',
        ExpressionAttributeValues: { ':ordemServicoId': ordemServicoId },
        Limit: 1,
      }),
    );
    const item = result.Items?.[0];
    return item ? this.toDomain(item) : null;
  }

  async getByMercadoPagoPaymentId(
    mercadoPagoPaymentId: string,
  ): Promise<Pagamento | null> {
    const result = await dynamoDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.pagamentos,
        IndexName: 'mercadoPagoPaymentId-index',
        KeyConditionExpression: 'mercadoPagoPaymentId = :mercadoPagoPaymentId',
        ExpressionAttributeValues: {
          ':mercadoPagoPaymentId': mercadoPagoPaymentId,
        },
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

  private toDomain(item: Record<string, unknown>): Pagamento {
    return Pagamento.reconstitute(
      item.id as string,
      item.ordemServicoId as string,
      item.orcamentoId as string,
      item.valor as number,
      new Date(item.criadoEm as string),
      item.status as StatusPagamento,
      new Date(item.atualizadoEm as string),
      item.mercadoPagoPaymentId as string | undefined,
      item.mercadoPagoPreferenceId as string | undefined,
      item.motivoRecusa as string | undefined,
    );
  }
}
