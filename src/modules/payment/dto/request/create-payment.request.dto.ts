import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Payment amount (VND)' })
  amount: number;

  @ApiProperty({ description: 'Order description / information' })
  orderInfo: string;

  @ApiProperty({ description: 'Order type' })
  orderType: string;

  @ApiPropertyOptional({ description: 'Bank code (NCB, VNPAYQR...)' })
  bankCode?: string;

  @ApiProperty({ required: true, description: 'Client ID' })
  clientId: string;

  @ApiProperty({ required: true, description: 'Lawyer ID' })
  lawyerId: string;

  @ApiPropertyOptional({ description: 'Booking ID' })
  bookingId?: string;
}

export class CreatePaymentRequestDto extends CreatePaymentDto {}
