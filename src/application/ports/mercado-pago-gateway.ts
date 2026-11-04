export interface PagamentoCriado {
  mercadoPagoPaymentId: string;
  mercadoPagoPreferenceId?: string;
}

export type StatusConsultaPagamento =
  'approved' | 'rejected' | 'pending' | 'refunded';

export interface PagamentoConsultado {
  status: StatusConsultaPagamento;
  motivoRecusa?: string;
}

/**
 * Porta (Clean Architecture) para o gateway de pagamentos. A camada de
 * aplicação só conhece este contrato; a infraestrutura fornece a
 * implementação real (SDK do Mercado Pago) ou uma fake (sem credenciais
 * configuradas, ver infraestructure/mercadopago/).
 */
export interface MercadoPagoGateway {
  criarPagamento(
    valor: number,
    descricao: string,
    externalReference: string,
  ): Promise<PagamentoCriado>;

  consultarPagamento(
    mercadoPagoPaymentId: string,
  ): Promise<PagamentoConsultado>;

  reembolsar(mercadoPagoPaymentId: string): Promise<void>;
}
