import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessNotificationService } from './mess-notification.service';
import { MessNotificationRepository } from './repository/mess-notification.repository';
import { MessageNotificationDestination } from 'libs/schemas/messageNotification';
import { MessageModule } from '../message/message.module';

import { MessNotificationController } from './mess-notification.controller';

@Module({
  imports: [
    MongooseModule.forFeature([MessageNotificationDestination]),
    forwardRef(() => MessageModule),
  ],
  controllers: [MessNotificationController],
  providers: [MessNotificationService, MessNotificationRepository],
  exports: [MessNotificationService, MessNotificationRepository],
})
export class MessNotificationModule {}
