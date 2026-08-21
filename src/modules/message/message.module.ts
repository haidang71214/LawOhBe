import { Module, forwardRef } from '@nestjs/common';
import { ChatService } from './message.service';
import { ChatController } from './message.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationDestination, MessageDestination } from 'libs/schemas';
import { MessageGateway } from './message.gateway';
import { ConversationRepository } from './repository/conversation.repository';
import { MessageRepository } from './repository/message.repository';
import { MessageMapper } from './mapper/message.mapper';
import { NotificationModule } from '../notification/notification.module';
import { MessNotificationModule } from '../mess-notification/mess-notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([ConversationDestination, MessageDestination]),
    forwardRef(() => NotificationModule),
    forwardRef(() => MessNotificationModule),
  ],

  controllers: [ChatController],
  providers: [
    ChatService,
    MessageGateway,
    ConversationRepository,
    MessageRepository,
    MessageMapper,
  ],
  exports: [
    ChatService,
    ConversationRepository,
    MessageRepository,
    MessageMapper,
    MessageGateway,
  ],
})
export class MessageModule {}
