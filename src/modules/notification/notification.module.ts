import { Module, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationDestination } from 'libs/schemas/notification';
import { NotificationRepository } from './repository/notification.repository';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [
    MongooseModule.forFeature([NotificationDestination]),
    forwardRef(() => MessageModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository],
  exports: [NotificationService],
})
export class NotificationModule {}
