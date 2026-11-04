export type StatusPagamento =
  'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'REEMBOLSADO';

/**
 * Maquina de estados do pagamento (mesmo estilo de entidade rica usado em
 * OrdemServico no oficina-os-service):
 *
 *   PENDENTE --aprovar--> APROVADO --reembolsar--> REEMBOLSADO
 *   PENDENTE --recusar--> RECUSADO
 */
export class Pagamento {
  private status: StatusPagamento;
  private mercadoPagoPaymentId?: string;
  private mercadoPagoPreferenceId?: string;
  private motivoRecusa?: string;
  private atualizadoEm: Date;

  constructor(
    public readonly id: string,
    public readonly ordemServicoId: string,
    public readonly orcamentoId: string,
    public readonly valor: number,
    public readonly criadoEm: Date = new Date(),
  ) {
    this.status = 'PENDENTE';
    this.atualizadoEm = criadoEm;
  }

  definirDadosMercadoPago(
    mercadoPagoPaymentId: string,
    mercadoPagoPreferenceId?: string,
  ) {
    this.mercadoPagoPaymentId = mercadoPagoPaymentId;
    this.mercadoPagoPreferenceId = mercadoPagoPreferenceId;
  }

  aprovar() {
    if (this.status !== 'PENDENTE') {
      throw new Error('Só é possível aprovar um pagamento PENDENTE');
    }
    this.status = 'APROVADO';
    this.atualizadoEm = new Date();
  }

  recusar(motivo: string) {
    if (this.status !== 'PENDENTE') {
      throw new Error('Só é possível recusar um pagamento PENDENTE');
    }
    this.status = 'RECUSADO';
    this.motivoRecusa = motivo;
    this.atualizadoEm = new Date();
  }

  reembolsar() {
    if (this.status !== 'APROVADO') {
      throw new Error('Só é possível reembolsar um pagamento APROVADO');
    }
    this.status = 'REEMBOLSADO';
    this.atualizadoEm = new Date();
  }

  static reconstitute(
    id: string,
    ordemServicoId: string,
    orcamentoId: string,
    valor: number,
    criadoEm: Date,
    status: StatusPagamento,
    atualizadoEm: Date,
    mercadoPagoPaymentId?: string,
    mercadoPagoPreferenceId?: string,
    motivoRecusa?: string,
  ): Pagamento {
    const pagamento = new Pagamento(
      id,
      ordemServicoId,
      orcamentoId,
      valor,
      criadoEm,
    );
    pagamento.status = status;
    pagamento.atualizadoEm = atualizadoEm;
    pagamento.mercadoPagoPaymentId = mercadoPagoPaymentId;
    pagamento.mercadoPagoPreferenceId = mercadoPagoPreferenceId;
    pagamento.motivoRecusa = motivoRecusa;
    return pagamento;
  }

  getStatus() {
    return this.status;
  }

  getMercadoPagoPaymentId() {
    return this.mercadoPagoPaymentId;
  }

  getMercadoPagoPreferenceId() {
    return this.mercadoPagoPreferenceId;
  }

  getMotivoRecusa() {
    return this.motivoRecusa;
  }

  getAtualizadoEm() {
    return this.atualizadoEm;
  }
}
