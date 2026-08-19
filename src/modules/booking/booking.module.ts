import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BookingDestination,
  CustomPriceDestination,
  UserDestination,
} from 'libs/schemas';
import { EmailModule } from 'src/shared/email/email.module';
import { BookingRepository } from './repository/booking.repository';
import { BookingMapper } from './mapper/booking.mapper';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      UserDestination,
      BookingDestination,
      CustomPriceDestination,
    ]),
    EmailModule,
    NotificationModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository, BookingMapper],
  exports: [BookingService, BookingRepository, BookingMapper],
})
export class BookingModule {}
