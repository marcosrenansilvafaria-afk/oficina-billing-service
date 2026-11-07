import { MercadoPagoGatewayService } from './mercadopago-gateway.service';

const createMock = jest.fn();
const getMock = jest.fn();
const refundCreateMock = jest.fn();

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Payment: jest.fn().mockImplementation(() => ({
    create: createMock,
    get: getMock,
  })),
  PaymentRefund: jest.fn().mockImplementation(() => ({
    create: refundCreateMock,
  })),
}));

describe('MercadoPagoGatewayService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('criarPagamento() cria uma cobranca Pix e retorna o id', async () => {
    createMock.mockResolvedValue({ id: 123456 });
    const gateway = new MercadoPagoGatewayService('token-fake');

    const resultado = await gateway.criarPagamento(150, 'OS os-1', 'os-1');

    expect(resultado.mercadoPagoPaymentId).toBe('123456');
    expect(createMock).toHaveBeenCalledWith({
      body: {
        transaction_amount: 150,
        description: 'OS os-1',
        payment_method_id: 'pix',
        external_reference: 'os-1',
      },
    });
  });

  it.each([
    ['approved', 'approved'],
    ['rejected', 'rejected'],
    ['cancelled', 'rejected'],
    ['refunded', 'refunded'],
    ['pending', 'pending'],
    [undefined, 'pending'],
  ])(
    'consultarPagamento() mapeia status "%s" para "%s"',
    async (origem, esperado) => {
      getMock.mockResolvedValue({ status: origem, status_detail: 'motivo-x' });
      const gateway = new MercadoPagoGatewayService('token-fake');

      const resultado = await gateway.consultarPagamento('mp-1');

      expect(resultado.status).toBe(esperado);
      expect(resultado.motivoRecusa).toBe('motivo-x');
    },
  );

  it('reembolsar() chama o endpoint de refund com o payment_id', async () => {
    refundCreateMock.mockResolvedValue({});
    const gateway = new MercadoPagoGatewayService('token-fake');

    await gateway.reembolsar('mp-1');

    expect(refundCreateMock).toHaveBeenCalledWith({ payment_id: 'mp-1' });
  });
});
