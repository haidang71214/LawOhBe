import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ChatService } from './message.service';
import { MessageGateway } from './message.gateway';
import {
  CreateConversationDto,
  ResponseDto,
  ConversationItemResponseDto,
  MessageItemResponseDto,
} from './dto';
import { AuthorizerDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { ApiTags } from '@nestjs/swagger';
import { MessNotificationService } from '../mess-notification/mess-notification.service';
import { ConversationRepository } from './repository/conversation.repository';
import { Types } from 'mongoose';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly messageGateway: MessageGateway,
    @Inject(forwardRef(() => MessNotificationService))
    private readonly messNotificationService: MessNotificationService,
    private readonly conversationRepository: ConversationRepository,
  ) {}
  // tạo phòng chat mới. có id của mình và người kia
  @Post('/conversations')
  @AuthorizerDecorator({ secured: true })
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<ConversationItemResponseDto>> {
    const participants = Array.from(
      new Set([...createConversationDto.participants, user.userId]),
    );
    return this.chatService.createConversation(participants);
  }

  @Get('/conversations/:userId')
  @AuthorizerDecorator({ secured: true })
  async getUserConversations(
    @Param('userId') userId: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<ConversationItemResponseDto[]>> {
    // If not admin, user can only get their own conversations
    const targetUserId = user.role === 'admin' ? userId : user.userId;
    return this.chatService.getConversationsForUser(targetUserId);
  }

  @Post('/messages')
  @AuthorizerDecorator({ secured: true })
  async sendMessage(
    @Body('conversationId') conversationId: string | null,
    @Body('content') content: string,
    @Body() createConversationDto: CreateConversationDto | null,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<MessageItemResponseDto>> {
    // vô database
    let finalConversationId = conversationId;
    if (
      (conversationId == null || conversationId == '') &&
      createConversationDto
    ) {
      const participants = Array.from(
        new Set([...createConversationDto.participants, user.userId]),
      );
      const newConversation =
        await this.chatService.createConversation(participants);
      finalConversationId = (newConversation as any)?.data?._id;
    }

    const result = await this.chatService.addMessage(
      finalConversationId!,
      user.userId, // ngừi gửi
      content,
    );

    // Emit live message to room and broadcast incoming notification
    try {
      if (this.messageGateway && this.messageGateway.server) {
        this.messageGateway.server
          .to(finalConversationId!)
          .emit('newMessage', result);
        const informationConversation =
          await this.conversationRepository.findById(finalConversationId!);

        const recipientId = informationConversation?.participants
          ?.map((p: any) => p.toString())
          ?.find((p: string) => p !== user.userId.toString());

        if (recipientId) {
          await this.messNotificationService.createOrUpdateMessageNotification({
            recipient_id: recipientId,
            sender_id: user.userId,
            conversation_id: finalConversationId!,
            last_message_id: (result as any)?.data?._id,
            content,
          });
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Socket emit error in ChatController: ${err?.message || err}`,
      );
    }

    return result;
  }

  @Get('/messages/:conversationId')
  @AuthorizerDecorator({ secured: true })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @UserData() user: AuthorizedMetadata,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ResponseDto<MessageItemResponseDto[]>> {
    return this.chatService.getMessages(
      conversationId,
      user.userId,
      page,
      limit,
    );
  }

  @Get('/conversations/check/:lawyerId')
  @AuthorizerDecorator({ secured: true })
  async checkConversation(
    @Param('lawyerId') lawyerId: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<ConversationItemResponseDto>> {
    return this.chatService.checkConversationExists(user.userId, lawyerId);
  }
}
