import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema, LawyerPayment, LawyerPaymentSchema, Payment, PaymentSchema, User, UserSchema } from 'src/config/database.config';
import { EmailModule } from 'src/email/email.module';
import { KeyModule } from 'src/key/key.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { TokenControllerService } from 'utils/token.utils';
import { ShareModule } from 'src/shared/sharedModule';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:User.name,schema:UserSchema},
      {name:Payment.name,schema:PaymentSchema},
      {name:LawyerPayment.name,schema:LawyerPaymentSchema},
      {name:Booking.name, schema:BookingSchema}
    ]),
JwtModule.register({}),KeyModule,EmailModule,ShareModule,TokenControllerService,AuthModule
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
