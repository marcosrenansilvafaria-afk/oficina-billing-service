import { SqsConsumerService } from './sqs-consumer.service';
import {
  orcamentoRepo,
  pagamentoRepo,
  mercadoPagoGateway,
} from '../singletons';
import { Pagamento } from '../../domain/entities/pagamento';

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  ReceiveMessageCommand: jest.fn(),
  DeleteMessageCommand: jest.fn(),
}));

async function despachar(service: SqsConsumerService, envelope: unknown) {
  await (
    service as unknown as { despachar(e: unknown): Promise<void> }
  ).despachar(envelope);
}

describe('SqsConsumerService', () => {
  let service: SqsConsumerService;

  beforeEach(async () => {
    service = new SqsConsumerService();
    await orcamentoRepo.clear();
    await pagamentoRepo.clear();
  });

  it('OrcamentoGeradoEvent registra o orcamento e cria o pagamento pendente', async () => {
    await despachar(service, {
      eventId: 'e1',
      eventType: 'OrcamentoGeradoEvent',
      correlationId: 'os-1',
      payload: {
        valorTotal: 150,
        itens: [
          {
            descricao: 'Troca de oleo',
            tipo: 'SERVICO',
            preco: 150,
            quantidade: 1,
          },
        ],
      },
    });

    const orcamento = await orcamentoRepo.getByOrdemServicoId('os-1');
    const pagamento = await pagamentoRepo.getByOrdemServicoId('os-1');
    expect(orcamento).not.toBeNull();
    expect(pagamento?.getStatus()).toBe('PENDENTE');
  });

  it('CompensarOSEvent com origemFalha=EXECUCAO reembolsa o pagamento aprovado', async () => {
    const pagamento = new Pagamento('pag-1', 'os-2', 'orc-2', 150);
    pagamento.definirDadosMercadoPago('mp-1');
    pagamento.aprovar();
    await pagamentoRepo.save(pagamento);

    await despachar(service, {
      eventId: 'e2',
      eventType: 'CompensarOSEvent',
      correlationId: 'os-2',
      payload: { origemFalha: 'EXECUCAO' },
    });

    const atualizado = await pagamentoRepo.getByOrdemServicoId('os-2');
    expect(atualizado?.getStatus()).toBe('REEMBOLSADO');
    expect(
      (mercadoPagoGateway as { reembolsos?: string[] }).reembolsos,
    ).toContain('mp-1');
  });

  it('CompensarOSEvent com origemFalha=PAGAMENTO e um eco idempotente (nao faz nada)', async () => {
    const pagamento = new Pagamento('pag-3', 'os-3', 'orc-3', 150);
    await pagamentoRepo.save(pagamento);

    await despachar(service, {
      eventId: 'e3',
      eventType: 'CompensarOSEvent',
      correlationId: 'os-3',
      payload: { origemFalha: 'PAGAMENTO' },
    });

    const inalterado = await pagamentoRepo.getByOrdemServicoId('os-3');
    expect(inalterado?.getStatus()).toBe('PENDENTE');
  });

  it('ignora eventos de tipo desconhecido sem lancar erro', async () => {
    await expect(
      despachar(service, {
        eventId: 'e4',
        eventType: 'EventoInexistente',
        correlationId: 'os-4',
        payload: {},
      }),
    ).resolves.toBeUndefined();
  });
});
