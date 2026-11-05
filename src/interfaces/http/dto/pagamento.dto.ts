import { ApiProperty } from '@nestjs/swagger';
import type { StatusPagamento } from '../../../domain/entities/pagamento';

export class PagamentoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ordemServicoId!: string;

  @ApiProperty()
  valor!: number;

  @ApiProperty({
    enum: ['PENDENTE', 'APROVADO', 'RECUSADO', 'REEMBOLSADO'],
  })
  status!: StatusPagamento;

  @ApiProperty({ required: false })
  mercadoPagoPaymentId?: string;
}
