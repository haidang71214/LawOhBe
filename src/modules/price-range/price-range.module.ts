import { Module } from '@nestjs/common';
import { PriceRangeService } from './price-range.service';
import { PriceRangeController } from './price-range.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BookingDestination,
  CustomPriceDestination,
  MarketPriceRangeDestination,
  PaymentDestination,
  UserDestination,
} from 'libs/schemas';
import { PriceRangeRepository } from './repository/price-range.repository';
import { PriceRangeMapper } from './mapper/price-range.mapper';
import { LawyerModule } from '../lawyer/lawyer.module';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      UserDestination,
      MarketPriceRangeDestination,
      CustomPriceDestination,
      BookingDestination,
      PaymentDestination,
    ]),
    LawyerModule,
    BookingModule,
  ],
  controllers: [PriceRangeController],
  providers: [PriceRangeService, PriceRangeRepository, PriceRangeMapper],
  exports: [PriceRangeService, PriceRangeRepository, PriceRangeMapper],
})
export class PriceRangeModule {}
