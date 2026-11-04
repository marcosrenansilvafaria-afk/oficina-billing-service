import { WebhookLog } from './webhook-log';

describe('WebhookLog', () => {
  it('deve guardar os dados de um webhook processado com sucesso', () => {
    const log = new WebhookLog('log-1', 'payment', '{"id":"123"}', true);

    expect(log.id).toBe('log-1');
    expect(log.tipo).toBe('payment');
    expect(log.processadoComSucesso).toBe(true);
    expect(log.erro).toBeUndefined();
  });

  it('deve guardar o motivo do erro quando o processamento falha', () => {
    const log = new WebhookLog(
      'log-2',
      'payment',
      '{}',
      false,
      'Assinatura invalida',
    );

    expect(log.processadoComSucesso).toBe(false);
    expect(log.erro).toBe('Assinatura invalida');
  });
});
