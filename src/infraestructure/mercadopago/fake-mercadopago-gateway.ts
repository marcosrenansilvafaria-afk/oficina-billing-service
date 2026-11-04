import { generateId } from '../../utils/id';
import {
  MercadoPagoGateway,
  PagamentoConsultado,
  PagamentoCriado,
  StatusConsultaPagamento,
} from '../../application/ports/mercado-pago-gateway';

/**
 * Gateway fake usado quando MERCADOPAGO_ACCESS_TOKEN nao esta configurado
 * (dev local/CI/testes, sem credenciais reais de sandbox do Mercado Pago -
 * ver pendencia no README). Determinístico: todo pagamento criado fica
 * disponível para consulta com o status configurado em
 * `definirProximoStatus` (default: 'approved').
 */
export class FakeMercadoPagoGateway implements MercadoPagoGateway {
  private proximoStatus: StatusConsultaPagamento = 'approved';
  private motivoRecusa?: string;
  public readonly reembolsos: string[] = [];

  definirProximoStatus(status: StatusConsultaPagamento, motivoRecusa?: string) {
    this.proximoStatus = status;
    this.motivoRecusa = motivoRecusa;
  }

  criarPagamento(): Promise<PagamentoCriado> {
    return Promise.resolve({
      mercadoPagoPaymentId: `fake-payment-${generateId()}`,
      mercadoPagoPreferenceId: `fake-preference-${generateId()}`,
    });
  }

  consultarPagamento(): Promise<PagamentoConsultado> {
    return Promise.resolve({
      status: this.proximoStatus,
      motivoRecusa: this.motivoRecusa,
    });
  }

  reembolsar(mercadoPagoPaymentId: string): Promise<void> {
    this.reembolsos.push(mercadoPagoPaymentId);
    return Promise.resolve();
  }
}
