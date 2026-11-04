import { InMemoryOrcamentoRepository } from './in-memory-orcamento-repository';
import { InMemoryPagamentoRepository } from './in-memory-pagamento-repository';
import { InMemoryWebhookLogRepository } from './in-memory-webhook-log-repository';
import { DynamoOrcamentoRepository } from './dynamodb/dynamo-orcamento.repository';
import { DynamoPagamentoRepository } from './dynamodb/dynamo-pagamento.repository';
import { DynamoWebhookLogRepository } from './dynamodb/dynamo-webhook-log.repository';
import { FakeMercadoPagoGateway } from './mercadopago/fake-mercadopago-gateway';
import { MercadoPagoGatewayService } from './mercadopago/mercadopago-gateway.service';
import { SnsPublisherService } from './saga/sns-publisher.service';
import { IOrcamentoRepository } from '../domain/repositories/orcamento-repository.interface';
import { IPagamentoRepository } from '../domain/repositories/pagamento-repository.interface';
import { IWebhookLogRepository } from '../domain/repositories/webhook-log-repository.interface';
import { MercadoPagoGateway } from '../application/ports/mercado-pago-gateway';
import { SagaPublisher } from '../application/ports/saga-publisher';

// Implementacoes padrao: in-memory + gateway fake (usadas por testes
// unitarios/BDD, sem dependencia de AWS/Mercado Pago reais). Em runtime,
// `useRealIntegrations()` troca para DynamoDB + Mercado Pago real quando
// configurados.
export let orcamentoRepo: IOrcamentoRepository =
  new InMemoryOrcamentoRepository();
export let pagamentoRepo: IPagamentoRepository =
  new InMemoryPagamentoRepository();
export let webhookLogRepo: IWebhookLogRepository =
  new InMemoryWebhookLogRepository();
export let mercadoPagoGateway: MercadoPagoGateway =
  new FakeMercadoPagoGateway();

export const sagaPublisher: SagaPublisher = new SnsPublisherService();

/**
 * Chamado no bootstrap (main.ts) ANTES de `NestFactory.create`, para que os
 * controllers/consumidores capturem as instancias corretas ao serem
 * construidos.
 */
export function useRealIntegrations() {
  orcamentoRepo = new DynamoOrcamentoRepository();
  pagamentoRepo = new DynamoPagamentoRepository();
  webhookLogRepo = new DynamoWebhookLogRepository();

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (accessToken) {
    mercadoPagoGateway = new MercadoPagoGatewayService(accessToken);
  }
}

export async function resetInMemoryRepositories() {
  await orcamentoRepo.clear();
  await pagamentoRepo.clear();
  await webhookLogRepo.clear();
}
