import * as singletons from './singletons';

describe('singletons', () => {
  afterEach(() => {
    singletons.definirProximoStatusMercadoPagoFake('approved');
  });

  it('definirProximoStatusMercadoPagoFake() aplica o status quando o gateway ativo e o fake', () => {
    const aplicado = singletons.definirProximoStatusMercadoPagoFake(
      'rejected',
      'sem saldo',
    );

    expect(aplicado).toBe(true);
  });

  it('resetInMemoryRepositories() limpa os repositorios in-memory', async () => {
    await expect(
      singletons.resetInMemoryRepositories(),
    ).resolves.toBeUndefined();
  });

  it('definirProximoStatusMercadoPagoFake() retorna false quando o gateway ativo nao e mais o fake', () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'token-fake-para-teste';
    try {
      singletons.useRealIntegrations();
      expect(singletons.definirProximoStatusMercadoPagoFake('rejected')).toBe(
        false,
      );
    } finally {
      delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    }
  });
});
