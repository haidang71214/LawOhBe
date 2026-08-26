import { Module } from '@nestjs/common';
import { ChatController } from './message.controller';
import { ChatService } from './message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema, Message, MessageSchema } from 'src/config/database.config';
import { AuthModule } from 'src/auth/auth.module';
import { TokenControllerService } from 'utils/token.utils';
import { KeyModule } from 'src/key/key.module';
import { JwtModule } from '@nestjs/jwt';


@Module({
  imports:[
    MongooseModule.forFeature([
      {name:Message.name,schema:MessageSchema},
      {name:Conversation.name,schema:ConversationSchema}
    ]),JwtModule.register({}),KeyModule,TokenControllerService,AuthModule
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class MessageModule {}
