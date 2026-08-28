import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class CommentItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  author_id: any;

  @ApiProperty({ required: false })
  parent_comment_id?: string;

  @ApiProperty({ type: [Object], required: false })
  replies?: any[];
}

export class CommentResponseDto extends ResponseDto<CommentItemResponseDto> {}
export class CommentListResponseDto extends ResponseDto<
  CommentItemResponseDto[]
> {}
