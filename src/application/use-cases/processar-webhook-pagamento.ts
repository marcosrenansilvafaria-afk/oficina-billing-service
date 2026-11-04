import { IPagamentoRepository } from '../../domain/repositories/pagamento-repository.interface';
import { MercadoPagoGateway } from '../ports/mercado-pago-gateway';
import { SagaPublisher } from '../ports/saga-publisher';

/**
 * Processa a notificacao de webhook do Mercado Pago. Nunca confia no corpo
 * do webhook para decidir o status - sempre consulta o pagamento real via
 * `consultarPagamento` antes de aprovar/recusar (pratica recomendada de
 * seguranca contra webhooks forjados/repetidos).
 *
 * Publica PagamentoAprovadoEvent (aprovado) ou PagamentoRecusadoEvent +
 * CompensarOSEvent com origemFalha=PAGAMENTO (recusado/expirado).
 */
export class ProcessarWebhookPagamento {
  constructor(
    private pagamentoRepo: IPagamentoRepository,
    private mercadoPago: MercadoPagoGateway,
    private sagaPublisher: SagaPublisher,
  ) {}

  async execute(mercadoPagoPaymentId: string): Promise<void> {
    const pagamento =
      await this.pagamentoRepo.getByMercadoPagoPaymentId(mercadoPagoPaymentId);
    if (!pagamento) {
      throw new Error(
        `Pagamento nao encontrado para mercadoPagoPaymentId=${mercadoPagoPaymentId}`,
      );
    }

    if (pagamento.getStatus() !== 'PENDENTE') {
      // Webhook duplicado/reentregue - idempotente, nao reprocessa.
      return;
    }

    const consulta =
      await this.mercadoPago.consultarPagamento(mercadoPagoPaymentId);

    if (consulta.status === 'approved') {
      pagamento.aprovar();
      await this.pagamentoRepo.save(pagamento);
      await this.sagaPublisher.publicar(
        'PagamentoAprovadoEvent',
        {
          ordemServicoId: pagamento.ordemServicoId,
          pagamentoId: pagamento.id,
          mercadoPagoPaymentId,
          valorPago: pagamento.valor,
          aprovadoEm: new Date().toISOString(),
        },
        pagamento.ordemServicoId,
      );
      return;
    }

    if (consulta.status === 'rejected') {
      const motivo = consulta.motivoRecusa || 'Pagamento recusado';
      pagamento.recusar(motivo);
      await this.pagamentoRepo.save(pagamento);
      await this.sagaPublisher.publicar(
        'PagamentoRecusadoEvent',
        {
          ordemServicoId: pagamento.ordemServicoId,
          pagamentoId: pagamento.id,
          mercadoPagoPaymentId,
          motivo,
          recusadoEm: new Date().toISOString(),
        },
        pagamento.ordemServicoId,
      );
      await this.sagaPublisher.publicar(
        'CompensarOSEvent',
        {
          ordemServicoId: pagamento.ordemServicoId,
          origemFalha: 'PAGAMENTO',
          motivo,
          compensarEm: new Date().toISOString(),
        },
        pagamento.ordemServicoId,
      );
      return;
    }

    // status 'pending' - aguarda proxima notificacao, nada a fazer ainda.
  }
}
