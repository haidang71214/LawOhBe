import { Module } from '@nestjs/common';
import { LawyerService } from './lawyer.service';
import { LawyerController } from './lawyer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema, MarketPriceRange, MarketPriceRangeSchema, Review, ReviewSchema, SubTypeLawyer, SubTypeLawyerSchema, TypeLawyer, TypeLawyerSchema, User, UserSchema, VipClient, VipClientSchema, VipPackage, VipPackageSchema } from 'src/config/database.config';
import { JwtModule } from '@nestjs/jwt';
import { KeyModule } from 'src/key/key.module';
import { EmailModule } from 'src/email/email.module';
import { ShareModule } from 'src/shared/sharedModule';
import { TokenControllerService } from 'utils/token.utils';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports:[
    MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),  // lấy thông tin
    MongooseModule.forFeature([{name:Review.name,schema:ReviewSchema}]), // review với sao
    // chẳng lẽ giờ lại làm theo kiểu block những luật sư đang bận:? chỗ luật sư đang bận làm bên fe được
    MongooseModule.forFeature([{name: TypeLawyer.name,schema:TypeLawyerSchema}]),  // kiểu luật sư
    MongooseModule.forFeature([{name: SubTypeLawyer.name,schema: SubTypeLawyerSchema}]),  // kiểu chi tiết
    MongooseModule.forFeature([{name:VipPackage.name,schema:VipPackageSchema}]), // lấy gói vip để thuê, chỗ này mình thay bằng ngày đi 
    MongooseModule.forFeature([{name:Booking.name,schema:BookingSchema}]), // thêm các trường hợp booking
    MongooseModule.forFeature([{name:VipClient.name,schema:VipClientSchema}]),
    MongooseModule.forFeature([{name:MarketPriceRange.name,schema:MarketPriceRangeSchema}]),
    JwtModule.register({}),KeyModule,EmailModule,ShareModule,TokenControllerService,AuthModule
  ],
  controllers: [LawyerController],
  providers: [LawyerService],
})
export class LawyerModule {}
