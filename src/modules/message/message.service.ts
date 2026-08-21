import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ResponseDto,
  ConversationItemResponseDto,
  MessageItemResponseDto,
} from './dto';
import { ConversationRepository } from './repository/conversation.repository';
import { MessageRepository } from './repository/message.repository';
import { MessageMapper } from './mapper/message.mapper';

@Injectable()
export class ChatService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly messageMapper: MessageMapper,
  ) {}

  async createConversation(
    participants: string[],
  ): Promise<ResponseDto<ConversationItemResponseDto>> {
    const existing =
      await this.conversationRepository.findConversationByParticipants(
        participants,
      );
    if (existing) {
      return ResponseDto.success(
        this.messageMapper.toConversationDto(existing),
        'Conversation already exists',
        HttpStatus.OK,
      );
    }

    const conversation = await this.conversationRepository.create({
      participants,
    });
    return ResponseDto.success(
      this.messageMapper.toConversationDto(conversation),
      'Conversation created successfully',
      HttpStatus.CREATED,
    );
  }

  async getConversationsForUser(
    userId: string,
  ): Promise<ResponseDto<ConversationItemResponseDto[]>> {
    const conversations =
      await this.conversationRepository.findUserConversations(userId);

    return ResponseDto.success(
      this.messageMapper.toConversationListDto(conversations),
      'Conversations retrieved successfully',
      HttpStatus.OK,
    );
  }

  async addMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<ResponseDto<MessageItemResponseDto>> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants?.some(
      (p: any) => p.toString() === senderId.toString(),
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const message = await this.messageRepository.create({
      conversation: conversationId,
      sender: senderId,
      content,
      readBy: [senderId],
    });

    return ResponseDto.success(
      this.messageMapper.toMessageDto(message),
      'Message sent successfully',
      HttpStatus.CREATED,
    );
  }
  async getMessages(
    conversationId: string,
    userId?: string,
    page = 1,
    limit = 20,
  ): Promise<ResponseDto<MessageItemResponseDto[]>> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      userId &&
      !conversation.participants?.some(
        (p: any) => p.toString() === userId.toString(),
      )
    ) {
      throw new ForbiddenException(
        'You do not have permission to view messages in this conversation',
      );
    }

    const messages = await this.messageRepository.findByConversation(
      conversationId,
      page,
      limit,
    );

    return ResponseDto.success(
      this.messageMapper.toMessageListDto(messages),
      'Messages retrieved successfully',
      HttpStatus.OK,
    );
  }

  async checkConversationExists(
    clientId: string,
    lawyerId: string,
  ): Promise<ResponseDto<ConversationItemResponseDto>> {
    const conversation =
      await this.conversationRepository.findConversationByParticipants([
        clientId,
        lawyerId,
      ]);

    if (!conversation) {
      throw new NotFoundException(
        `Conversation not found between ${clientId} and ${lawyerId}`,
      );
    }

    return ResponseDto.success(
      this.messageMapper.toConversationDto(conversation),
      'Conversation found',
      HttpStatus.OK,
    );
  }
}
