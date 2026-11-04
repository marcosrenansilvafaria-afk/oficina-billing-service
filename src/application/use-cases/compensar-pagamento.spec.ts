import { InMemoryOrcamentoRepository } from '../../infraestructure/in-memory-orcamento-repository';
import { InMemoryPagamentoRepository } from '../../infraestructure/in-memory-pagamento-repository';
import { FakeMercadoPagoGateway } from '../../infraestructure/mercadopago/fake-mercadopago-gateway';
import { ReceberOrcamento } from './receber-orcamento';
import { ProcessarWebhookPagamento } from './processar-webhook-pagamento';
import { CompensarPagamento } from './compensar-pagamento';
import { FakeSagaPublisher } from '../ports/fake-saga-publisher';

describe('CompensarPagamento', () => {
  async function prepararPagamentoAprovado() {
    const orcamentoRepo = new InMemoryOrcamentoRepository();
    const pagamentoRepo = new InMemoryPagamentoRepository();
    const mercadoPago = new FakeMercadoPagoGateway();
    mercadoPago.definirProximoStatus('approved');

    const pagamento = await new ReceberOrcamento(
      orcamentoRepo,
      pagamentoRepo,
      mercadoPago,
    ).execute({ ordemServicoId: 'os-1', valorTotal: 150, itens: [] });
    await new ProcessarWebhookPagamento(
      pagamentoRepo,
      mercadoPago,
      new FakeSagaPublisher(),
    ).execute(pagamento.getMercadoPagoPaymentId()!);

    return { pagamentoRepo, mercadoPago, pagamento };
  }

  it('deve reembolsar quando origemFalha e EXECUCAO', async () => {
    const { pagamentoRepo, mercadoPago, pagamento } =
      await prepararPagamentoAprovado();
    const useCase = new CompensarPagamento(pagamentoRepo, mercadoPago);

    await useCase.execute('os-1', 'EXECUCAO');

    const atualizado = await pagamentoRepo.getById(pagamento.id);
    expect(atualizado?.getStatus()).toBe('REEMBOLSADO');
  });

  it('nao deve fazer nada quando origemFalha e PAGAMENTO (eco do proprio evento)', async () => {
    const { pagamentoRepo, mercadoPago, pagamento } =
      await prepararPagamentoAprovado();
    const useCase = new CompensarPagamento(pagamentoRepo, mercadoPago);

    await useCase.execute('os-1', 'PAGAMENTO');

    const atualizado = await pagamentoRepo.getById(pagamento.id);
    expect(atualizado?.getStatus()).toBe('APROVADO');
    expect(mercadoPago.reembolsos).toHaveLength(0);
  });
});
