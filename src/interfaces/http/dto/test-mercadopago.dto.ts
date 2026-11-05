import { ApiProperty } from '@nestjs/swagger';
import type { StatusConsultaPagamento } from '../../../application/ports/mercado-pago-gateway';

export class DefinirProximoStatusMercadoPagoDto {
  @ApiProperty({ enum: ['approved', 'rejected', 'pending', 'refunded'] })
  status!: StatusConsultaPagamento;

  @ApiProperty({ required: false })
  motivoRecusa?: string;
}
