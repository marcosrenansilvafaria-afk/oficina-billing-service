import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { generateId } from '../../utils/id';
import { WebhookLog } from '../../domain/entities/webhook-log';
import { ProcessarWebhookPagamento } from '../../application/use-cases/processar-webhook-pagamento';
import { validarAssinaturaWebhook } from '../../infraestructure/mercadopago/webhook-signature';
import {
  pagamentoRepo,
  mercadoPagoGateway,
  sagaPublisher,
  webhookLogRepo,
} from '../../infraestructure/singletons';
import { MercadoPagoWebhookDto } from './dto/webhook-mercadopago.dto';

/**
 * Rota publica (sem JWT - o Mercado Pago nao envia Bearer token): a
 * seguranca vem da validacao do header `x-signature`, nao de
 * autenticacao de usuario. Ver infraestructure/mercadopago/webhook-signature.ts.
 */
@Controller('webhooks')
@ApiTags('webhooks')
export class WebhookMercadoPagoController {
  private readonly logger = new Logger(WebhookMercadoPagoController.name);
  private readonly processarWebhook = new ProcessarWebhookPagamento(
    pagamentoRepo,
    mercadoPagoGateway,
    sagaPublisher,
  );

  @ApiExcludeEndpoint()
  @ApiBody({ type: MercadoPagoWebhookDto })
  @Post('mercadopago')
  @HttpCode(200)
  async receber(
    @Headers('x-signature') xSignature: string | undefined,
    @Headers('x-request-id') xRequestId: string | undefined,
    @Body() body: MercadoPagoWebhookDto,
  ) {
    const dataId = body?.data?.id ?? '';
    const assinaturaValida = validarAssinaturaWebhook(
      process.env.MERCADOPAGO_WEBHOOK_SECRET,
      xSignature,
      xRequestId,
      dataId,
    );

    await webhookLogRepo.save(
      new WebhookLog(
        generateId(),
        body?.type ?? 'desconhecido',
        JSON.stringify(body ?? {}),
        assinaturaValida,
        assinaturaValida ? undefined : 'Assinatura x-signature invalida',
      ),
    );

    if (!assinaturaValida) {
      this.logger.warn(
        `Webhook recusado: assinatura invalida (dataId=${dataId})`,
      );
      throw new UnauthorizedException('Assinatura invalida');
    }

    if (body?.type === 'payment' && dataId) {
      await this.processarWebhook.execute(dataId);
    }

    return { recebido: true };
  }
}
