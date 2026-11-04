import { InMemoryOrcamentoRepository } from '../../infraestructure/in-memory-orcamento-repository';
import { InMemoryPagamentoRepository } from '../../infraestructure/in-memory-pagamento-repository';
import { FakeMercadoPagoGateway } from '../../infraestructure/mercadopago/fake-mercadopago-gateway';
import { ReceberOrcamento } from './receber-orcamento';

describe('ReceberOrcamento', () => {
  it('deve salvar o orcamento e criar um pagamento PENDENTE', async () => {
    const orcamentoRepo = new InMemoryOrcamentoRepository();
    const pagamentoRepo = new InMemoryPagamentoRepository();
    const mercadoPago = new FakeMercadoPagoGateway();
    const useCase = new ReceberOrcamento(
      orcamentoRepo,
      pagamentoRepo,
      mercadoPago,
    );

    const pagamento = await useCase.execute({
      ordemServicoId: 'os-1',
      valorTotal: 150,
      itens: [
        { descricao: 'Revisao', tipo: 'SERVICO', preco: 150, quantidade: 1 },
      ],
    });

    expect(pagamento.getStatus()).toBe('PENDENTE');
    expect(pagamento.getMercadoPagoPaymentId()).toMatch(/^fake-payment-/);

    const orcamentoSalvo = await orcamentoRepo.getByOrdemServicoId('os-1');
    expect(orcamentoSalvo?.valorTotal).toBe(150);

    const pagamentoSalvo = await pagamentoRepo.getByOrdemServicoId('os-1');
    expect(pagamentoSalvo?.id).toBe(pagamento.id);
  });
});
