import { join } from 'path';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { InMemoryOrcamentoRepository } from '../../src/infraestructure/in-memory-orcamento-repository';
import { InMemoryPagamentoRepository } from '../../src/infraestructure/in-memory-pagamento-repository';
import { FakeMercadoPagoGateway } from '../../src/infraestructure/mercadopago/fake-mercadopago-gateway';
import { FakeSagaPublisher } from '../../src/application/ports/fake-saga-publisher';
import { ReceberOrcamento } from '../../src/application/use-cases/receber-orcamento';
import { ProcessarWebhookPagamento } from '../../src/application/use-cases/processar-webhook-pagamento';
import { CompensarPagamento } from '../../src/application/use-cases/compensar-pagamento';
import { Pagamento } from '../../src/domain/entities/pagamento';

const feature = loadFeature(join(__dirname, 'pagamento.feature'));

defineFeature(feature, (test) => {
  let orcamentoRepo: InMemoryOrcamentoRepository;
  let pagamentoRepo: InMemoryPagamentoRepository;
  let mercadoPago: FakeMercadoPagoGateway;
  let sagaPublisher: FakeSagaPublisher;
  let pagamento: Pagamento;

  beforeEach(() => {
    orcamentoRepo = new InMemoryOrcamentoRepository();
    pagamentoRepo = new InMemoryPagamentoRepository();
    mercadoPago = new FakeMercadoPagoGateway();
    sagaPublisher = new FakeSagaPublisher();
  });

  test('Pagamento aprovado', ({ given, when, then, and }) => {
    given('um orcamento gerado para a ordem de servico "os-1"', async () => {
      mercadoPago.definirProximoStatus('approved');
      pagamento = await new ReceberOrcamento(
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
    });

    when('o webhook do Mercado Pago confirma o pagamento', async () => {
      await new ProcessarWebhookPagamento(
        pagamentoRepo,
        mercadoPago,
        sagaPublisher,
      ).execute(pagamento.getMercadoPagoPaymentId()!);
    });

    then(
      /^o pagamento da ordem de servico deve estar "(.*)"$/,
      async (statusEsperado: string) => {
        const atual = await pagamentoRepo.getByOrdemServicoId('os-1');
        expect(atual?.getStatus()).toBe(statusEsperado);
      },
    );

    and('o evento PagamentoAprovadoEvent deve ter sido publicado', () => {
      expect(
        sagaPublisher.eventosPublicados.some(
          (e) => e.eventType === 'PagamentoAprovadoEvent',
        ),
      ).toBe(true);
    });
  });

  test('Compensacao - estorno por falha de execucao', ({
    given,
    when,
    then,
  }) => {
    given('um pagamento aprovado para a ordem de servico "os-1"', async () => {
      mercadoPago.definirProximoStatus('approved');
      pagamento = await new ReceberOrcamento(
        orcamentoRepo,
        pagamentoRepo,
        mercadoPago,
      ).execute({ ordemServicoId: 'os-1', valorTotal: 150, itens: [] });
      await new ProcessarWebhookPagamento(
        pagamentoRepo,
        mercadoPago,
        sagaPublisher,
      ).execute(pagamento.getMercadoPagoPaymentId()!);
    });

    when(
      /^o evento CompensarOSEvent com origem "(.*)" e recebido$/,
      async (origemFalha: 'PAGAMENTO' | 'EXECUCAO') => {
        await new CompensarPagamento(pagamentoRepo, mercadoPago).execute(
          'os-1',
          origemFalha,
        );
      },
    );

    then(
      /^o pagamento da ordem de servico deve estar "(.*)"$/,
      async (statusEsperado: string) => {
        const atual = await pagamentoRepo.getByOrdemServicoId('os-1');
        expect(atual?.getStatus()).toBe(statusEsperado);
      },
    );
  });
});
