import { Module } from '@nestjs/common';
import { LawyerService } from './lawyer.service';
import { LawyerController } from './lawyer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Booking,
  BookingSchema,
  CustomPrice,
  CustomPriceSchema,
  MarketPriceRange,
  MarketPriceRangeSchema,
  Review,
  ReviewSchema,
  SubTypeLawyer,
  SubTypeLawyerSchema,
  TypeLawyer,
  TypeLawyerSchema,
  User,
  UserSchema,
} from 'src/config/database.config';
import { JwtModule } from '@nestjs/jwt';
import { KeyModule } from 'src/key/key.module';
import { EmailModule } from 'src/email/email.module';
import { ShareModule } from 'src/shared/sharedModule';
import { TokenControllerService } from 'utils/token.utils';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    MongooseModule.forFeature([
      { name: TypeLawyer.name, schema: TypeLawyerSchema },
    ]),
    MongooseModule.forFeature([
      { name: SubTypeLawyer.name, schema: SubTypeLawyerSchema },
    ]),
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    MongooseModule.forFeature([
      { name: MarketPriceRange.name, schema: MarketPriceRangeSchema },
    ]),
    MongooseModule.forFeature([
      { name: CustomPrice.name, schema: CustomPriceSchema },
    ]),
    JwtModule.register({}),
    KeyModule,
    EmailModule,
    ShareModule,
    TokenControllerService,
    AuthModule,
  ],
  controllers: [LawyerController],
  providers: [LawyerService],
})
export class LawyerModule {}
