import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BookingDestination,
  LawyerPaymentDestination,
  PaymentDestination,
  UserDestination,
} from 'libs/schemas';
import { PaymentRepository } from './repository/payment.repository';
import { LawyerPaymentRepository } from './repository/lawyer-payment.repository';
import { PaymentMapper } from './mapper/payment.mapper';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      UserDestination,
      PaymentDestination,
      LawyerPaymentDestination,
      BookingDestination,
    ]),
    BookingModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentRepository,
    LawyerPaymentRepository,
    PaymentMapper,
  ],
  exports: [
    PaymentService,
    PaymentRepository,
    LawyerPaymentRepository,
    PaymentMapper,
  ],
})
export class PaymentModule {}
