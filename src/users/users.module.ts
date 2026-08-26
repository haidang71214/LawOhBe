import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema, LearnPackage, LearnPackageSchema, Review, ReviewSchema, SubTypeLawyer, SubTypeLawyerSchema, TypeLawyer, TypeLawyerSchema, User, UserSchema, VipPackage, VipPackageSchema } from 'src/config/database.config';
import { EmailModule } from 'src/email/email.module';
import { ShareModule } from 'src/shared/sharedModule';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { KeyModule } from 'src/key/key.module';

@Module({
  // có dòng này mới import được vào mongo
  imports: [
  // import mấy cái bên ngoài vào
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: VipPackage.name, schema: VipPackageSchema },
      { name: LearnPackage.name, schema: LearnPackageSchema },
      {name:TypeLawyer.name,schema: TypeLawyerSchema},
      {name:SubTypeLawyer.name,schema :SubTypeLawyerSchema},
      {name:Booking.name,schema:BookingSchema}, // cần import cái booking vô, người dùng cần render ra cái booking
      {name:Review.name,schema:ReviewSchema} // người dùng cần render ra cái review
    ]),
   EmailModule,ShareModule,AuthModule,JwtModule,KeyModule
  ], controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
