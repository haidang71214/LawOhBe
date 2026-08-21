import { Injectable } from '@nestjs/common';
import { Conversation, Message } from 'libs/schemas';
import { toDto, toDtoList } from 'libs/utils/mapper.util';
import { ConversationItemResponseDto, MessageItemResponseDto } from '../dto';

@Injectable()
export class MessageMapper {
  toConversationDto(conversation: Conversation): ConversationItemResponseDto {
    return toDto(ConversationItemResponseDto, conversation);
  }

  toConversationListDto(
    conversations: Conversation[],
  ): ConversationItemResponseDto[] {
    return toDtoList(ConversationItemResponseDto, conversations);
  }

  toMessageDto(message: Message): MessageItemResponseDto {
    return toDto(MessageItemResponseDto, message);
  }

  toMessageListDto(messages: Message[]): MessageItemResponseDto[] {
    return toDtoList(MessageItemResponseDto, messages);
  }
}
