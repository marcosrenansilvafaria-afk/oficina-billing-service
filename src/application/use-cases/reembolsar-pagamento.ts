import { IPagamentoRepository } from '../../domain/repositories/pagamento-repository.interface';
import { MercadoPagoGateway } from '../ports/mercado-pago-gateway';

/**
 * Reage ao CompensarOSEvent (origemFalha=EXECUCAO): o pagamento ja tinha
 * sido aprovado, mas o reparo falhou depois de iniciado - estorna no
 * Mercado Pago.
 */
export class ReembolsarPagamento {
  constructor(
    private pagamentoRepo: IPagamentoRepository,
    private mercadoPago: MercadoPagoGateway,
  ) {}

  async execute(ordemServicoId: string): Promise<void> {
    const pagamento =
      await this.pagamentoRepo.getByOrdemServicoId(ordemServicoId);
    if (!pagamento) {
      throw new Error(
        `Pagamento nao encontrado para ordemServicoId=${ordemServicoId}`,
      );
    }

    const mercadoPagoPaymentId = pagamento.getMercadoPagoPaymentId();
    if (!mercadoPagoPaymentId) {
      throw new Error('Pagamento sem mercadoPagoPaymentId associado');
    }

    await this.mercadoPago.reembolsar(mercadoPagoPaymentId);
    pagamento.reembolsar();
    await this.pagamentoRepo.save(pagamento);
  }
}
