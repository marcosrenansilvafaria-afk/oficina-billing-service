import { NotFoundException } from '@nestjs/common';
import { TestMercadoPagoController } from './test-mercadopago.controller';

describe('TestMercadoPagoController', () => {
  const controller = new TestMercadoPagoController();
  const originalEnv = process.env.ENABLE_SAGA_E2E_TEST_ENDPOINTS;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ENABLE_SAGA_E2E_TEST_ENDPOINTS;
    } else {
      process.env.ENABLE_SAGA_E2E_TEST_ENDPOINTS = originalEnv;
    }
  });

  it('retorna 404 quando ENABLE_SAGA_E2E_TEST_ENDPOINTS nao esta habilitado', () => {
    delete process.env.ENABLE_SAGA_E2E_TEST_ENDPOINTS;

    expect(() =>
      controller.definirProximoStatus({ status: 'rejected' }),
    ).toThrow(NotFoundException);
  });

  it('aplica o status quando habilitado e o gateway fake esta ativo', () => {
    process.env.ENABLE_SAGA_E2E_TEST_ENDPOINTS = 'true';

    expect(() =>
      controller.definirProximoStatus({
        status: 'rejected',
        motivoRecusa: 'teste',
      }),
    ).not.toThrow();
  });
});
