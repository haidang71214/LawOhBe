import { IsArray, ArrayMinSize, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({
    type: [String],
    description: 'List of participant user IDs',
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'Must have at least 2 participants' })
  @IsMongoId({
    each: true,
    message: 'Each participant must be a valid Mongo ObjectId',
  })
  participants: string[];
}

export class CreateConversationRequestDto extends CreateConversationDto {}
