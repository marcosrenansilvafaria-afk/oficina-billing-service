import { Pagamento } from './pagamento';

describe('Pagamento', () => {
  it('deve iniciar com status PENDENTE', () => {
    const pagamento = new Pagamento('pag-1', 'os-1', 'orc-1', 150);

    expect(pagamento.getStatus()).toBe('PENDENTE');
  });

  it('deve aprovar um pagamento PENDENTE', () => {
    const pagamento = new Pagamento('pag-1', 'os-1', 'orc-1', 150);

    pagamento.aprovar();

    expect(pagamento.getStatus()).toBe('APROVADO');
  });

  it('deve recusar um pagamento PENDENTE e guardar o motivo', () => {
    const pagamento = new Pagamento('pag-1', 'os-1', 'orc-1', 150);

    pagamento.recusar('saldo insuficiente');

    expect(pagamento.getStatus()).toBe('RECUSADO');
    expect(pagamento.getMotivoRecusa()).toBe('saldo insuficiente');
  });

  it('deve reembolsar um pagamento APROVADO', () => {
    const pagamento = new Pagamento('pag-1', 'os-1', 'orc-1', 150);
    pagamento.aprovar();

    pagamento.reembolsar();

    expect(pagamento.getStatus()).toBe('REEMBOLSADO');
  });

  it('deve impedir aprovar um pagamento que nao esta PENDENTE', () => {
    const pagamento = new Pagamento('pag-1', 'os-1', 'orc-1', 150);
    pagamento.aprovar();

    expect(() => pagamento.aprovar()).toThrow(
      'Só é possível aprovar um pagamento PENDENTE',
    );
  });

  it('deve impedir recusar um pagamento que nao esta PENDENTE', () => {
    const pagamento = new Pagamento('pag-1', 'os-1', 'orc-1', 150);
    pagamento.aprovar();

    expect(() => pagamento.recusar('motivo')).toThrow(
      'Só é possível recusar um pagamento PENDENTE',
    );
  });

  it('deve impedir reembolsar um pagamento que nao esta APROVADO', () => {
    const pagamento = new Pagamento('pag-1', 'os-1', 'orc-1', 150);

    expect(() => pagamento.reembolsar()).toThrow(
      'Só é possível reembolsar um pagamento APROVADO',
    );
  });

  it('deve guardar os dados do Mercado Pago', () => {
    const pagamento = new Pagamento('pag-1', 'os-1', 'orc-1', 150);

    pagamento.definirDadosMercadoPago('mp-123', 'pref-123');

    expect(pagamento.getMercadoPagoPaymentId()).toBe('mp-123');
    expect(pagamento.getMercadoPagoPreferenceId()).toBe('pref-123');
  });

  it('reconstitute deve restaurar o estado completo', () => {
    const criadoEm = new Date('2026-01-01');
    const atualizadoEm = new Date('2026-01-02');

    const pagamento = Pagamento.reconstitute(
      'pag-1',
      'os-1',
      'orc-1',
      150,
      criadoEm,
      'APROVADO',
      atualizadoEm,
      'mp-123',
      'pref-123',
      undefined,
    );

    expect(pagamento.getStatus()).toBe('APROVADO');
    expect(pagamento.getMercadoPagoPaymentId()).toBe('mp-123');
    expect(pagamento.getAtualizadoEm()).toBe(atualizadoEm);
  });
});
