import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parent_comment_id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class CreateCommentRequestDto extends CreateCommentDto {}
