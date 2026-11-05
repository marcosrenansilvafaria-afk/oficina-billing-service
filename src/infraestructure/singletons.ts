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
import {
  MercadoPagoGateway,
  StatusConsultaPagamento,
} from '../application/ports/mercado-pago-gateway';
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

const fakeMercadoPagoGateway = new FakeMercadoPagoGateway();
export let mercadoPagoGateway: MercadoPagoGateway = fakeMercadoPagoGateway;

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

/**
 * Seam de teste para a simulacao E2E do Saga (Sprint 5, ver
 * oficina-app/test/saga-e2e/): forca o proximo status que o
 * FakeMercadoPagoGateway vai devolver em consultarPagamento(), permitindo
 * simular "pagamento recusado" via HTTP sem credenciais reais do Mercado
 * Pago. So tem efeito quando o gateway ativo ainda e o fake (nao foi
 * substituido por `useRealIntegrations()`); retorna false caso contrario,
 * para o controller recusar a chamada.
 */
export function definirProximoStatusMercadoPagoFake(
  status: StatusConsultaPagamento,
  motivoRecusa?: string,
): boolean {
  if (mercadoPagoGateway !== fakeMercadoPagoGateway) return false;
  fakeMercadoPagoGateway.definirProximoStatus(status, motivoRecusa);
  return true;
}
