import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema, CustomPrice, CustomPriceSchema, MarketPriceRange, MarketPriceRangeSchema, Review, ReviewSchema, SubTypeLawyer, SubTypeLawyerSchema, TypeLawyer, TypeLawyerSchema, User, UserSchema, VipPackage, VipPackageSchema } from 'src/config/database.config';
import { AuthModule } from 'src/auth/auth.module';
import { TokenControllerService } from 'utils/token.utils';
import { ShareModule } from 'src/shared/sharedModule';
import { EmailModule } from 'src/email/email.module';
import { KeyModule } from 'src/key/key.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:User.name,schema:UserSchema},
      {name:Booking.name,schema:BookingSchema},
      { name: VipPackage.name, schema: VipPackageSchema},
      {name:TypeLawyer.name,schema: TypeLawyerSchema},
      {name:SubTypeLawyer.name,schema :SubTypeLawyerSchema},
      {name:Review.name,schema:ReviewSchema},
      {name:MarketPriceRange.name,schema:MarketPriceRangeSchema},
      {name:CustomPrice.name,schema:CustomPriceSchema}
    ]),
     JwtModule.register({}),KeyModule,EmailModule,ShareModule,TokenControllerService,AuthModule
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
