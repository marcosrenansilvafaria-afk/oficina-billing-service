import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Validacao do header `x-signature` enviado pelo Mercado Pago em todo
 * webhook (formato documentado: "ts=<timestamp>,v1=<hash>"). O manifest
 * assinado e "id:<dataId>;request-id:<requestId>;ts:<ts>;", com HMAC-SHA256
 * usando o secret configurado em MERCADOPAGO_WEBHOOK_SECRET.
 *
 * Retorna `true` quando o secret nao esta configurado (dev local, sem
 * credenciais reais do Mercado Pago) - quem chama deve logar um aviso
 * nesse caso, nao tratar como uma assinatura valida "de verdade".
 */
export function validarAssinaturaWebhook(
  secret: string | undefined,
  xSignatureHeader: string | undefined,
  xRequestId: string | undefined,
  dataId: string,
): boolean {
  if (!secret) return true;
  if (!xSignatureHeader) return false;

  const partes = new Map<string, string>();
  for (const parte of xSignatureHeader.split(',')) {
    const [chave, valor] = parte.trim().split('=');
    if (chave && valor) partes.set(chave, valor);
  }
  const ts = partes.get('ts');
  const v1 = partes.get('v1');
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId ?? ''};ts:${ts};`;
  const hashEsperado = createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  const bufferEsperado = Buffer.from(hashEsperado, 'hex');
  const bufferRecebido = Buffer.from(v1, 'hex');
  if (bufferEsperado.length !== bufferRecebido.length) return false;

  return timingSafeEqual(bufferEsperado, bufferRecebido);
}
