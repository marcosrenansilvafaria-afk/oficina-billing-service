import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago';
import {
  MercadoPagoGateway,
  PagamentoConsultado,
  PagamentoCriado,
  StatusConsultaPagamento,
} from '../../application/ports/mercado-pago-gateway';

/**
 * Implementacao real via SDK oficial do Mercado Pago (v2). Usada apenas
 * quando MERCADOPAGO_ACCESS_TOKEN esta configurado - ver
 * FakeMercadoPagoGateway para o fallback de dev local/CI.
 */
export class MercadoPagoGatewayService implements MercadoPagoGateway {
  private readonly payment: Payment;
  private readonly refund: PaymentRefund;

  constructor(accessToken: string) {
    const client = new MercadoPagoConfig({ accessToken });
    this.payment = new Payment(client);
    this.refund = new PaymentRefund(client);
  }

  async criarPagamento(
    valor: number,
    descricao: string,
    externalReference: string,
  ): Promise<PagamentoCriado> {
    const resultado = await this.payment.create({
      body: {
        transaction_amount: valor,
        description: descricao,
        payment_method_id: 'pix',
        external_reference: externalReference,
      },
    });

    return {
      mercadoPagoPaymentId: String(resultado.id),
    };
  }

  async consultarPagamento(
    mercadoPagoPaymentId: string,
  ): Promise<PagamentoConsultado> {
    const resultado = await this.payment.get({ id: mercadoPagoPaymentId });

    return {
      status: this.mapearStatus(resultado.status),
      motivoRecusa: resultado.status_detail,
    };
  }

  async reembolsar(mercadoPagoPaymentId: string): Promise<void> {
    await this.refund.create({ payment_id: mercadoPagoPaymentId });
  }

  private mapearStatus(status?: string | null): StatusConsultaPagamento {
    switch (status) {
      case 'approved':
        return 'approved';
      case 'rejected':
      case 'cancelled':
        return 'rejected';
      case 'refunded':
        return 'refunded';
      default:
        return 'pending';
    }
  }
}
