import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BookingDestination,
  ReviewDestination,
  UserDestination,
} from 'libs/schemas';
import { ReviewRepository } from './repository/review.repository';
import { ReviewMapper } from './mapper/review.mapper';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      ReviewDestination,
      UserDestination,
      BookingDestination,
    ]),
    BookingModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository, ReviewMapper],
  exports: [ReviewService, ReviewRepository, ReviewMapper],
})
export class ReviewModule {}
