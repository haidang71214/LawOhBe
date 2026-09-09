import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { configuration } from './Configuration';
import {
  MongoProvider,
  RedisProvider,
  ThrottlerProvider,
  BullMqProvider,
} from 'libs/configuration';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { LawyerModule } from './modules/lawyer/lawyer.module';
import { BookingModule } from './modules/booking/booking.module';
import { PriceRangeModule } from './modules/price-range/price-range.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReviewModule } from './modules/review/review.module';
import { StorageModule } from './shared/storage/storage.module';
import { RedisModule } from './shared/redis/redis.module';
import { FormModule } from './modules/form/form.module';
import { MessageModule } from './modules/message/message.module';
import { ClassificationModule } from './modules/classification/classification.module';
import { VideoModule } from './modules/video/video.module';
import { CommentModule } from './modules/comment/comment.module';
import { NewsModule } from './modules/news/news.module';
import { LearnPackageModule } from './modules/learn-package/learn-package.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CustomThrottlerGuard } from 'libs/guard/custom-throttler.guard';
import { UserGuard } from 'libs/guard/user.guard';
import { RoleGuard } from 'libs/guard/role.guard';
import { ExceptionInterceptor } from 'libs/interceptor/Exception.interceptor';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDestination } from 'libs/schemas';
import { MetricsModule, LoggerModule } from 'libs/observable';
import { LoggerMiddleware } from 'libs/middlewares/logger.middleware';

import { SanitizeMiddleware } from 'libs/middlewares/sanitize.middleware';
import { NotificationModule } from './modules/notification/notification.module';
import { MessNotificationModule } from './modules/mess-notification/mess-notification.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    MetricsModule,
    LoggerModule.forRoot('law-ohbe'),
    MongoProvider,
    RedisProvider,
    ThrottlerProvider,
    BullMqProvider,
    MongooseModule.forFeature([UserDestination]),
    UsersModule,
    AuthModule,
    LawyerModule,
    BookingModule,
    PriceRangeModule,
    StorageModule,
    RedisModule,
    PaymentModule,
    ReviewModule,
    FormModule,
    MessageModule,
    ClassificationModule,
    VideoModule,
    CommentModule,
    NewsModule,
    LearnPackageModule,
    NotificationModule,
    MessNotificationModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UserGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ExceptionInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware, SanitizeMiddleware).forRoutes('*');
  }
}
