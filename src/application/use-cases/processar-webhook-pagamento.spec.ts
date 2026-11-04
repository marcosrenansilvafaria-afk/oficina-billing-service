import { InMemoryOrcamentoRepository } from '../../infraestructure/in-memory-orcamento-repository';
import { InMemoryPagamentoRepository } from '../../infraestructure/in-memory-pagamento-repository';
import { FakeMercadoPagoGateway } from '../../infraestructure/mercadopago/fake-mercadopago-gateway';
import { FakeSagaPublisher } from '../ports/fake-saga-publisher';
import { ReceberOrcamento } from './receber-orcamento';
import { ProcessarWebhookPagamento } from './processar-webhook-pagamento';

describe('ProcessarWebhookPagamento', () => {
  async function prepararPagamentoPendente(
    mercadoPago: FakeMercadoPagoGateway,
  ) {
    const orcamentoRepo = new InMemoryOrcamentoRepository();
    const pagamentoRepo = new InMemoryPagamentoRepository();
    const pagamento = await new ReceberOrcamento(
      orcamentoRepo,
      pagamentoRepo,
      mercadoPago,
    ).execute({
      ordemServicoId: 'os-1',
      valorTotal: 150,
      itens: [
        { descricao: 'Revisao', tipo: 'SERVICO', preco: 150, quantidade: 1 },
      ],
    });
    return { pagamentoRepo, pagamento };
  }

  it('deve aprovar o pagamento e publicar PagamentoAprovadoEvent', async () => {
    const mercadoPago = new FakeMercadoPagoGateway();
    mercadoPago.definirProximoStatus('approved');
    const { pagamentoRepo, pagamento } =
      await prepararPagamentoPendente(mercadoPago);
    const sagaPublisher = new FakeSagaPublisher();
    const useCase = new ProcessarWebhookPagamento(
      pagamentoRepo,
      mercadoPago,
      sagaPublisher,
    );

    await useCase.execute(pagamento.getMercadoPagoPaymentId()!);

    const atualizado = await pagamentoRepo.getById(pagamento.id);
    expect(atualizado?.getStatus()).toBe('APROVADO');
    expect(sagaPublisher.eventosPublicados).toHaveLength(1);
    expect(sagaPublisher.eventosPublicados[0].eventType).toBe(
      'PagamentoAprovadoEvent',
    );
    expect(sagaPublisher.eventosPublicados[0].correlationId).toBe('os-1');
  });

  it('deve recusar o pagamento e publicar PagamentoRecusadoEvent + CompensarOSEvent', async () => {
    const mercadoPago = new FakeMercadoPagoGateway();
    mercadoPago.definirProximoStatus('rejected', 'saldo insuficiente');
    const { pagamentoRepo, pagamento } =
      await prepararPagamentoPendente(mercadoPago);
    const sagaPublisher = new FakeSagaPublisher();
    const useCase = new ProcessarWebhookPagamento(
      pagamentoRepo,
      mercadoPago,
      sagaPublisher,
    );

    await useCase.execute(pagamento.getMercadoPagoPaymentId()!);

    const atualizado = await pagamentoRepo.getById(pagamento.id);
    expect(atualizado?.getStatus()).toBe('RECUSADO');
    expect(sagaPublisher.eventosPublicados.map((e) => e.eventType)).toEqual([
      'PagamentoRecusadoEvent',
      'CompensarOSEvent',
    ]);
    expect(sagaPublisher.eventosPublicados[1].payload.origemFalha).toBe(
      'PAGAMENTO',
    );
  });

  it('nao deve reprocessar um pagamento que ja nao esta PENDENTE (webhook duplicado)', async () => {
    const mercadoPago = new FakeMercadoPagoGateway();
    mercadoPago.definirProximoStatus('approved');
    const { pagamentoRepo, pagamento } =
      await prepararPagamentoPendente(mercadoPago);
    const sagaPublisher = new FakeSagaPublisher();
    const useCase = new ProcessarWebhookPagamento(
      pagamentoRepo,
      mercadoPago,
      sagaPublisher,
    );

    await useCase.execute(pagamento.getMercadoPagoPaymentId()!);
    await useCase.execute(pagamento.getMercadoPagoPaymentId()!);

    expect(sagaPublisher.eventosPublicados).toHaveLength(1);
  });

  it('deve lancar erro quando o pagamento nao e encontrado', async () => {
    const pagamentoRepo = new InMemoryPagamentoRepository();
    const mercadoPago = new FakeMercadoPagoGateway();
    const sagaPublisher = new FakeSagaPublisher();
    const useCase = new ProcessarWebhookPagamento(
      pagamentoRepo,
      mercadoPago,
      sagaPublisher,
    );

    await expect(useCase.execute('inexistente')).rejects.toThrow(
      'Pagamento nao encontrado',
    );
  });
});
