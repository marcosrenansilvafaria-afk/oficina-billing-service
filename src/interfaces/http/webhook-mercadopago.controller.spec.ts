import { UnauthorizedException } from '@nestjs/common';
import { WebhookMercadoPagoController } from './webhook-mercadopago.controller';
import { Pagamento } from '../../domain/entities/pagamento';
import {
  pagamentoRepo,
  webhookLogRepo,
  mercadoPagoGateway,
} from '../../infraestructure/singletons';
import { StatusConsultaPagamento } from '../../application/ports/mercado-pago-gateway';

describe('WebhookMercadoPagoController', () => {
  let controller: WebhookMercadoPagoController;
  const originalSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  beforeEach(async () => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    controller = new WebhookMercadoPagoController();
    await pagamentoRepo.clear();
    await webhookLogRepo.clear();
    (
      mercadoPagoGateway as unknown as {
        definirProximoStatus: (s: StatusConsultaPagamento) => void;
      }
    ).definirProximoStatus('approved');
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    } else {
      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    }
  });

  it('processa o webhook de pagamento aprovado quando a assinatura e valida (sem secret configurado)', async () => {
    const pagamento = new Pagamento('pag-1', 'os-1', 'orc-1', 150);
    pagamento.definirDadosMercadoPago('mp-1');
    await pagamentoRepo.save(pagamento);

    const result = await controller.receber(undefined, undefined, {
      type: 'payment',
      data: { id: 'mp-1' },
    });

    expect(result).toEqual({ recebido: true });
    const atualizado = await pagamentoRepo.getById('pag-1');
    expect(atualizado?.getStatus()).toBe('APROVADO');
  });

  it('rejeita com 401 e registra o log quando a assinatura e invalida', async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = 'segredo-de-teste';

    await expect(
      controller.receber(undefined, undefined, {
        type: 'payment',
        data: { id: 'mp-1' },
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('nao processa pagamento quando o tipo do webhook nao e "payment"', async () => {
    const result = await controller.receber(undefined, undefined, {
      type: 'merchant_order',
      data: { id: 'mp-1' },
    });

    expect(result).toEqual({ recebido: true });
  });
});
