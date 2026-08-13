import { PartialType } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payment.request.dto';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}
export class UpdatePaymentRequestDto extends UpdatePaymentDto {}
