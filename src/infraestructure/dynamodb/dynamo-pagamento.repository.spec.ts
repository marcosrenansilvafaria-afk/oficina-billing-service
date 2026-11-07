import { DynamoPagamentoRepository } from './dynamo-pagamento.repository';
import { Pagamento } from '../../domain/entities/pagamento';
import { dynamoDocClient } from './dynamo.client';

function buildItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'pag-1',
    ordemServicoId: 'os-1',
    orcamentoId: 'orc-1',
    valor: 150,
    status: 'PENDENTE',
    mercadoPagoPaymentId: 'mp-1',
    mercadoPagoPreferenceId: undefined,
    motivoRecusa: undefined,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    ...overrides,
  };
}

describe('DynamoPagamentoRepository', () => {
  afterEach(() => jest.restoreAllMocks());

  it('save() grava o item no DynamoDB com os campos corretos', async () => {
    const sendSpy = jest
      .spyOn(dynamoDocClient, 'send')
      .mockResolvedValue({} as never);
    const repo = new DynamoPagamentoRepository();
    const pagamento = new Pagamento('pag-1', 'os-1', 'orc-1', 150);

    await repo.save(pagamento);

    const command = sendSpy.mock.calls[0][0] as {
      input: { Item: { id: string } };
    };
    expect(command.input.Item.id).toBe('pag-1');
  });

  it('getById() retorna null quando o item nao existe', async () => {
    jest.spyOn(dynamoDocClient, 'send').mockResolvedValue({} as never);
    const repo = new DynamoPagamentoRepository();

    expect(await repo.getById('inexistente')).toBeNull();
  });

  it('getById() reconstitui a entidade a partir do item', async () => {
    jest
      .spyOn(dynamoDocClient, 'send')
      .mockResolvedValue({ Item: buildItem() } as never);
    const repo = new DynamoPagamentoRepository();

    const pagamento = await repo.getById('pag-1');

    expect(pagamento).toBeInstanceOf(Pagamento);
    expect(pagamento?.getMercadoPagoPaymentId()).toBe('mp-1');
  });

  it('getByOrdemServicoId() retorna null quando nao ha resultado', async () => {
    jest
      .spyOn(dynamoDocClient, 'send')
      .mockResolvedValue({ Items: [] } as never);
    const repo = new DynamoPagamentoRepository();

    expect(await repo.getByOrdemServicoId('os-1')).toBeNull();
  });

  it('getByOrdemServicoId() reconstitui a entidade a partir do primeiro item', async () => {
    jest
      .spyOn(dynamoDocClient, 'send')
      .mockResolvedValue({ Items: [buildItem()] } as never);
    const repo = new DynamoPagamentoRepository();

    const pagamento = await repo.getByOrdemServicoId('os-1');

    expect(pagamento?.id).toBe('pag-1');
  });

  it('getByMercadoPagoPaymentId() retorna null quando nao ha resultado', async () => {
    jest
      .spyOn(dynamoDocClient, 'send')
      .mockResolvedValue({ Items: [] } as never);
    const repo = new DynamoPagamentoRepository();

    expect(await repo.getByMercadoPagoPaymentId('mp-1')).toBeNull();
  });

  it('getByMercadoPagoPaymentId() reconstitui a entidade a partir do primeiro item', async () => {
    jest
      .spyOn(dynamoDocClient, 'send')
      .mockResolvedValue({ Items: [buildItem()] } as never);
    const repo = new DynamoPagamentoRepository();

    const pagamento = await repo.getByMercadoPagoPaymentId('mp-1');

    expect(pagamento?.id).toBe('pag-1');
  });

  it('clear() rejeita - nao suportado no DynamoDB real', async () => {
    const repo = new DynamoPagamentoRepository();

    await expect(repo.clear()).rejects.toThrow(
      'clear() nao e suportado pelo repositorio DynamoDB real',
    );
  });
});
