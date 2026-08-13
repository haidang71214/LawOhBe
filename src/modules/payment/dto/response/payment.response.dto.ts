import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class PaymentItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  orderInfo: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  client_id: any;

  @ApiProperty()
  lawyer_id: any;

  @ApiProperty({ required: false })
  booking_id?: any;

  @ApiProperty({ required: false })
  transaction_no?: string;

  @ApiProperty({ required: false })
  payment_method?: string;

  @ApiProperty({ required: false })
  payment_date?: Date;

  @ApiProperty({ required: false })
  isDeleted?: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class PaymentListResponseDataDto {
  @ApiProperty({ type: [PaymentItemResponseDto] })
  data: PaymentItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  page?: number;

  @ApiProperty({ required: false })
  limit?: number;

  @ApiProperty({ required: false })
  totalPages?: number;
}

export class PaymentUrlResponseDto {
  @ApiProperty()
  paymentUrl: string;

  @ApiProperty({ required: false })
  txnRef?: string;
}

export class PaymentResponseDto extends ResponseDto<PaymentItemResponseDto> {}
export class PaymentUrlCreatedResponseDto extends ResponseDto<PaymentUrlResponseDto> {}
export class PaymentListResponseDto extends ResponseDto<PaymentListResponseDataDto> {}
