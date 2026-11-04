import { IPagamentoRepository } from '../../domain/repositories/pagamento-repository.interface';
import { MercadoPagoGateway } from '../ports/mercado-pago-gateway';
import { ReembolsarPagamento } from './reembolsar-pagamento';

export type OrigemFalhaCompensacao = 'PAGAMENTO' | 'EXECUCAO';

/**
 * Dispatcher do CompensarOSEvent para o Billing Service. A fila deste
 * servico recebe TODO CompensarOSEvent (a filter policy do SNS so filtra
 * por eventType, nao pelo payload), inclusive os que o proprio Billing
 * Service publicou (origemFalha=PAGAMENTO) - nesse caso e um eco
 * idempotente, nao ha nada a fazer. Só origemFalha=EXECUCAO aciona o
 * reembolso (o pagamento ja tinha sido aprovado antes da execucao falhar).
 */
export class CompensarPagamento {
  private readonly reembolsar: ReembolsarPagamento;

  constructor(
    pagamentoRepo: IPagamentoRepository,
    mercadoPago: MercadoPagoGateway,
  ) {
    this.reembolsar = new ReembolsarPagamento(pagamentoRepo, mercadoPago);
  }

  async execute(
    ordemServicoId: string,
    origemFalha: OrigemFalhaCompensacao,
  ): Promise<void> {
    if (origemFalha === 'EXECUCAO') {
      await this.reembolsar.execute(ordemServicoId);
    }
    // origemFalha === 'PAGAMENTO': eco do proprio evento que este servico
    // publicou - nenhuma acao necessaria.
  }
}
