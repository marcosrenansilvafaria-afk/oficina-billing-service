import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { pagamentoRepo } from '../../infraestructure/singletons';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/roles.enum';
import { PagamentoResponseDto } from './dto/pagamento.dto';

@Controller('pagamentos')
@ApiTags('pagamentos')
export class PagamentoController {
  @ApiOperation({ summary: 'Consultar o pagamento de uma ordem de servico' })
  @ApiParam({ name: 'ordemServicoId' })
  @ApiOkResponse({ type: PagamentoResponseDto })
  @ApiNotFoundResponse({ description: 'Pagamento nao encontrado' })
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ATENDENTE)
  @Get(':ordemServicoId')
  async buscar(
    @Param('ordemServicoId') ordemServicoId: string,
  ): Promise<PagamentoResponseDto> {
    const pagamento = await pagamentoRepo.getByOrdemServicoId(ordemServicoId);
    if (!pagamento) throw new NotFoundException('Pagamento não encontrado');

    return {
      id: pagamento.id,
      ordemServicoId: pagamento.ordemServicoId,
      valor: pagamento.valor,
      status: pagamento.getStatus(),
    };
  }
}
