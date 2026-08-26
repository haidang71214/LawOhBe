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
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/LawOhBeLocal',
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
    
    UsersModule,
    AuthModule,
    LawyerModule,
    VipPackageModule,
    BookingModule,
    PriceRangeModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
