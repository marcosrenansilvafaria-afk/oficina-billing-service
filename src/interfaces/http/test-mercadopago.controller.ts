import {
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { definirProximoStatusMercadoPagoFake } from '../../infraestructure/singletons';
import { DefinirProximoStatusMercadoPagoDto } from './dto/test-mercadopago.dto';

/**
 * Seam de teste exclusivo para a simulacao E2E do Saga (Sprint 5, ver
 * oficina-app/test/saga-e2e/). So funciona com ENABLE_SAGA_E2E_TEST_ENDPOINTS=true
 * (ausente por padrao) e com o gateway fake do Mercado Pago ativo
 * (nenhuma credencial real configurada) - em qualquer outro caso retorna
 * 404, sem nenhum efeito em producao real.
 */
@ApiExcludeController()
@Controller('test/mercadopago')
export class TestMercadoPagoController {
  @Post('proximo-status')
  @HttpCode(204)
  definirProximoStatus(@Body() body: DefinirProximoStatusMercadoPagoDto) {
    if (process.env.ENABLE_SAGA_E2E_TEST_ENDPOINTS !== 'true') {
      throw new NotFoundException();
    }

    const aplicado = definirProximoStatusMercadoPagoFake(
      body.status,
      body.motivoRecusa,
    );
    if (!aplicado) {
      throw new NotFoundException(
        'Endpoint de teste indisponivel: gateway real do Mercado Pago em uso',
      );
    }
  }
}
