/**
 * Registro append-only de todo webhook recebido do Mercado Pago (inclusive
 * os que falharam na validacao de assinatura) - historico de auditoria,
 * nunca atualizado depois de criado.
 */
export class WebhookLog {
  constructor(
    public readonly id: string,
    public readonly tipo: string,
    public readonly payloadBruto: string,
    public readonly processadoComSucesso: boolean,
    public readonly erro?: string,
    public readonly recebidoEm: Date = new Date(),
  ) {}
}
