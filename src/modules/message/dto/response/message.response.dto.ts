import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class MessageItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  conversationId: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;
}

export class ConversationItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ type: [Object] })
  participants: any[];

  @ApiProperty({ required: false })
  lastMessage?: any;
}

export class MessageResponseDto extends ResponseDto<MessageItemResponseDto> {}
export class MessageListResponseDto extends ResponseDto<
  MessageItemResponseDto[]
> {}
export class ConversationResponseDto extends ResponseDto<ConversationItemResponseDto> {}
export class ConversationListResponseDto extends ResponseDto<
  ConversationItemResponseDto[]
> {}
