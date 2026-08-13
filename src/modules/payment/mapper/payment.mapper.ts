import { Injectable } from '@nestjs/common';
import { Payment } from 'libs/schemas';
import { toDto, toDtoList } from 'libs/utils/mapper.util';
import { PaymentItemResponseDto, PaymentListResponseDataDto } from '../dto';

@Injectable()
export class PaymentMapper {
  toResponseDto(payment: Payment): PaymentItemResponseDto {
    return toDto(PaymentItemResponseDto, payment);
  }

  toListResponseDto(
    payments: Payment[],
    total: number,
    page: number,
    limit: number,
  ): PaymentListResponseDataDto {
    return {
      data: toDtoList(PaymentItemResponseDto, payments),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
