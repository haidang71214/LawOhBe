import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LawyerModule } from './lawyer/lawyer.module';
import { VipPackageModule } from './vip-package/vip-package.module';
import { BookingModule } from './booking/booking.module';
import { PriceRangeModule } from './price-range/price-range.module';
import { PaymentModule } from './payment/payment.module';
import { ReviewModule } from './review/review.module';
import { StorageModule } from './storage/storage.module';
import { FormModule } from './form/form.module';
import { MessageModule } from './message/message.module';
import { ClassificationModule } from './classification/classification.module';
import { VideoModule } from './video/video.module';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || configService.get<string>('MONGODB_URL'),
      }),
      inject: [ConfigService],
    }),
    
    UsersModule,
    AuthModule,
    LawyerModule,
    VipPackageModule,
    BookingModule,
    PriceRangeModule,
    StorageModule,
    PaymentModule,
    ReviewModule,
    StorageModule,
    FormModule,
    MessageModule,
    ClassificationModule,
    VideoModule,
    CommentModule,
 
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
