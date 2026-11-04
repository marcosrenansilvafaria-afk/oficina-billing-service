import { createHmac } from 'crypto';
import { validarAssinaturaWebhook } from './webhook-signature';

describe('validarAssinaturaWebhook', () => {
  const secret = 'meu-secret-de-teste';
  const dataId = 'payment-123';
  const requestId = 'req-abc';
  const ts = '1700000000';

  function assinar(id: string, reqId: string, timestamp: string) {
    const manifest = `id:${id};request-id:${reqId};ts:${timestamp};`;
    return createHmac('sha256', secret).update(manifest).digest('hex');
  }

  it('retorna true quando nenhum secret esta configurado (dev local)', () => {
    const resultado = validarAssinaturaWebhook(
      undefined,
      'ts=1,v1=abc',
      requestId,
      dataId,
    );

    expect(resultado).toBe(true);
  });

  it('retorna false quando o secret existe mas o header esta ausente', () => {
    const resultado = validarAssinaturaWebhook(
      secret,
      undefined,
      requestId,
      dataId,
    );

    expect(resultado).toBe(false);
  });

  it('retorna true para uma assinatura valida', () => {
    const v1 = assinar(dataId, requestId, ts);
    const header = `ts=${ts},v1=${v1}`;

    const resultado = validarAssinaturaWebhook(
      secret,
      header,
      requestId,
      dataId,
    );

    expect(resultado).toBe(true);
  });

  it('retorna false para uma assinatura invalida', () => {
    const header = `ts=${ts},v1=${'0'.repeat(64)}`;

    const resultado = validarAssinaturaWebhook(
      secret,
      header,
      requestId,
      dataId,
    );

    expect(resultado).toBe(false);
  });

  it('retorna false quando o header esta malformado', () => {
    const resultado = validarAssinaturaWebhook(
      secret,
      'header-invalido-sem-formato',
      requestId,
      dataId,
    );

    expect(resultado).toBe(false);
  });
});
