import { InMemoryOrcamentoRepository } from '../../infraestructure/in-memory-orcamento-repository';
import { InMemoryPagamentoRepository } from '../../infraestructure/in-memory-pagamento-repository';
import { FakeMercadoPagoGateway } from '../../infraestructure/mercadopago/fake-mercadopago-gateway';
import { ReceberOrcamento } from './receber-orcamento';
import { ProcessarWebhookPagamento } from './processar-webhook-pagamento';
import { ReembolsarPagamento } from './reembolsar-pagamento';
import { FakeSagaPublisher } from '../ports/fake-saga-publisher';

describe('ReembolsarPagamento', () => {
  async function prepararPagamentoAprovado() {
    const orcamentoRepo = new InMemoryOrcamentoRepository();
    const pagamentoRepo = new InMemoryPagamentoRepository();
    const mercadoPago = new FakeMercadoPagoGateway();
    mercadoPago.definirProximoStatus('approved');

    const pagamento = await new ReceberOrcamento(
      orcamentoRepo,
      pagamentoRepo,
      mercadoPago,
    ).execute({
      ordemServicoId: 'os-1',
      valorTotal: 150,
      itens: [],
    });
    await new ProcessarWebhookPagamento(
      pagamentoRepo,
      mercadoPago,
      new FakeSagaPublisher(),
    ).execute(pagamento.getMercadoPagoPaymentId()!);

    return { pagamentoRepo, mercadoPago, pagamento };
  }

  it('deve reembolsar um pagamento aprovado no Mercado Pago e atualizar o status', async () => {
    const { pagamentoRepo, mercadoPago, pagamento } =
      await prepararPagamentoAprovado();
    const useCase = new ReembolsarPagamento(pagamentoRepo, mercadoPago);

    await useCase.execute('os-1');

    const atualizado = await pagamentoRepo.getById(pagamento.id);
    expect(atualizado?.getStatus()).toBe('REEMBOLSADO');
    expect(mercadoPago.reembolsos).toContain(
      pagamento.getMercadoPagoPaymentId(),
    );
  });

  it('deve lancar erro quando nao ha pagamento para a OS', async () => {
    const pagamentoRepo = new InMemoryPagamentoRepository();
    const mercadoPago = new FakeMercadoPagoGateway();
    const useCase = new ReembolsarPagamento(pagamentoRepo, mercadoPago);

    await expect(useCase.execute('os-inexistente')).rejects.toThrow(
      'Pagamento nao encontrado',
    );
  });
});
