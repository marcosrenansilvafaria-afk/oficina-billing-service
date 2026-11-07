import { NotFoundException } from '@nestjs/common';
import { PagamentoController } from './pagamento.controller';
import { Pagamento } from '../../domain/entities/pagamento';
import { pagamentoRepo } from '../../infraestructure/singletons';

describe('PagamentoController', () => {
  let controller: PagamentoController;

  beforeEach(async () => {
    controller = new PagamentoController();
    await pagamentoRepo.clear();
  });

  it('buscar() retorna o pagamento mapeado para o DTO', async () => {
    const pagamento = new Pagamento('pag-1', 'os-1', 'orc-1', 150);
    pagamento.definirDadosMercadoPago('mp-1');
    await pagamentoRepo.save(pagamento);

    const result = await controller.buscar('os-1');

    expect(result).toEqual({
      id: 'pag-1',
      ordemServicoId: 'os-1',
      valor: 150,
      status: 'PENDENTE',
      mercadoPagoPaymentId: 'mp-1',
    });
  });

  it('buscar() lanca NotFoundException quando nao ha pagamento para a OS', async () => {
    await expect(controller.buscar('inexistente')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
