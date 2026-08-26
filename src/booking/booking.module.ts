import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema, MarketPriceRange, MarketPriceRangeSchema, Review, ReviewSchema, SubTypeLawyer, SubTypeLawyerSchema, TypeLawyer, TypeLawyerSchema, User, UserSchema, VipPackage, VipPackageSchema } from 'src/config/database.config';
import { KeyModule } from 'src/key/key.module';
import { EmailModule } from 'src/email/email.module';
import { ShareModule } from 'src/shared/sharedModule';
import { TokenControllerService } from 'utils/token.utils';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  // mai làm booking
  imports:[
  MongooseModule.forFeature([
         { name: User.name, schema: UserSchema },
         { name: VipPackage.name, schema: VipPackageSchema },
         {name:TypeLawyer.name,schema: TypeLawyerSchema},
         {name:SubTypeLawyer.name,schema :SubTypeLawyerSchema},
         {name:Booking.name,schema:BookingSchema},
         {name:Review.name,schema:ReviewSchema},
         {name:MarketPriceRange.name,schema:MarketPriceRangeSchema}
       ]),
        JwtModule.register({}),KeyModule,EmailModule,ShareModule,TokenControllerService,AuthModule
  ],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
