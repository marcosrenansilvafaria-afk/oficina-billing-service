import { DynamoOrcamentoRepository } from './dynamo-orcamento.repository';
import { Orcamento } from '../../domain/entities/orcamento';
import { dynamoDocClient } from './dynamo.client';

describe('DynamoOrcamentoRepository', () => {
  afterEach(() => jest.restoreAllMocks());

  it('save() grava o item no DynamoDB com os campos corretos', async () => {
    const sendSpy = jest
      .spyOn(dynamoDocClient, 'send')
      .mockResolvedValue({} as never);
    const repo = new DynamoOrcamentoRepository();
    const orcamento = new Orcamento('orc-1', 'os-1', 150, [
      {
        descricao: 'Troca de oleo',
        tipo: 'SERVICO',
        preco: 150,
        quantidade: 1,
      },
    ]);

    await repo.save(orcamento);

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const command = sendSpy.mock.calls[0][0] as {
      input: { Item: { id: string } };
    };
    expect(command.input.Item.id).toBe('orc-1');
  });

  it('getById() retorna null quando o item nao existe', async () => {
    jest.spyOn(dynamoDocClient, 'send').mockResolvedValue({} as never);
    const repo = new DynamoOrcamentoRepository();

    expect(await repo.getById('inexistente')).toBeNull();
  });

  it('getById() reconstitui a entidade a partir do item', async () => {
    jest.spyOn(dynamoDocClient, 'send').mockResolvedValue({
      Item: {
        id: 'orc-1',
        ordemServicoId: 'os-1',
        valorTotal: 150,
        itens: [],
        recebidoEm: new Date().toISOString(),
      },
    } as never);
    const repo = new DynamoOrcamentoRepository();

    const orcamento = await repo.getById('orc-1');

    expect(orcamento).toBeInstanceOf(Orcamento);
    expect(orcamento?.ordemServicoId).toBe('os-1');
  });

  it('getByOrdemServicoId() retorna null quando nao ha resultado', async () => {
    jest
      .spyOn(dynamoDocClient, 'send')
      .mockResolvedValue({ Items: [] } as never);
    const repo = new DynamoOrcamentoRepository();

    expect(await repo.getByOrdemServicoId('os-1')).toBeNull();
  });

  it('getByOrdemServicoId() reconstitui a entidade a partir do primeiro item', async () => {
    jest.spyOn(dynamoDocClient, 'send').mockResolvedValue({
      Items: [
        {
          id: 'orc-1',
          ordemServicoId: 'os-1',
          valorTotal: 150,
          itens: [],
          recebidoEm: new Date().toISOString(),
        },
      ],
    } as never);
    const repo = new DynamoOrcamentoRepository();

    const orcamento = await repo.getByOrdemServicoId('os-1');

    expect(orcamento?.id).toBe('orc-1');
  });

  it('clear() rejeita - nao suportado no DynamoDB real', async () => {
    const repo = new DynamoOrcamentoRepository();

    await expect(repo.clear()).rejects.toThrow(
      'clear() nao e suportado pelo repositorio DynamoDB real',
    );
  });
});
