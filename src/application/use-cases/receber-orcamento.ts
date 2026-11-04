import { generateId } from '../../utils/id';
import { Orcamento, ItemOrcamento } from '../../domain/entities/orcamento';
import { Pagamento } from '../../domain/entities/pagamento';
import { IOrcamentoRepository } from '../../domain/repositories/orcamento-repository.interface';
import { IPagamentoRepository } from '../../domain/repositories/pagamento-repository.interface';
import { MercadoPagoGateway } from '../ports/mercado-pago-gateway';

export interface ReceberOrcamentoInput {
  ordemServicoId: string;
  valorTotal: number;
  itens: ItemOrcamento[];
}

/**
 * Reage ao OrcamentoGeradoEvent (SagaPattern, ver
 * oficina-app/docs/SAGA_PATTERN_SPEC.md): registra o orcamento recebido e
 * abre a cobranca no Mercado Pago.
 */
export class ReceberOrcamento {
  constructor(
    private orcamentoRepo: IOrcamentoRepository,
    private pagamentoRepo: IPagamentoRepository,
    private mercadoPago: MercadoPagoGateway,
  ) {}

  async execute(input: ReceberOrcamentoInput): Promise<Pagamento> {
    const orcamento = new Orcamento(
      generateId(),
      input.ordemServicoId,
      input.valorTotal,
      input.itens,
    );
    await this.orcamentoRepo.save(orcamento);

    const pagamento = new Pagamento(
      generateId(),
      input.ordemServicoId,
      orcamento.id,
      input.valorTotal,
    );

    const criado = await this.mercadoPago.criarPagamento(
      input.valorTotal,
      `Ordem de Serviço ${input.ordemServicoId}`,
      input.ordemServicoId,
    );
    pagamento.definirDadosMercadoPago(
      criado.mercadoPagoPaymentId,
      criado.mercadoPagoPreferenceId,
    );

    await this.pagamentoRepo.save(pagamento);
    return pagamento;
  }
}
