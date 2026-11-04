import { ApiProperty } from '@nestjs/swagger';

export class MercadoPagoWebhookDataDto {
  @ApiProperty({ example: '123456789' })
  id!: string;
}

export class MercadoPagoWebhookDto {
  @ApiProperty({ example: 'payment.updated', required: false })
  action?: string;

  @ApiProperty({ example: 'payment' })
  type!: string;

  @ApiProperty({ type: MercadoPagoWebhookDataDto })
  data!: MercadoPagoWebhookDataDto;
}
