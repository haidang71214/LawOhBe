import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserDestination,
  BookingDestination,
  TypeLawyerDestination,
  SubTypeLawyerDestination,
  ReviewDestination,
  MarketPriceRangeDestination,
  CustomPriceDestination,
} from 'libs/schemas';
import { AuthModule } from 'src/auth/auth.module';
import { TokenControllerService } from 'utils/token.utils';
import { ShareModule } from 'src/shared/sharedModule';
import { EmailModule } from 'src/email/email.module';
import { KeyModule } from 'src/key/key.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      UserDestination,
      BookingDestination,
      TypeLawyerDestination,
      SubTypeLawyerDestination,
      ReviewDestination,
      MarketPriceRangeDestination,
      CustomPriceDestination,
    ]),
    JwtModule.register({}),
    KeyModule,
    EmailModule,
    ShareModule,
    TokenControllerService,
    AuthModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
