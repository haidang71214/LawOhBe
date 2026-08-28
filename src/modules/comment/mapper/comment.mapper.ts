import { Injectable } from '@nestjs/common';
import { Comment } from 'libs/schemas';
import { toDto } from 'libs/utils/mapper.util';
import { CommentItemResponseDto } from '../dto';

@Injectable()
export class CommentMapper {
  toResponseDto(comment: Comment): CommentItemResponseDto {
    return toDto(CommentItemResponseDto, comment);
  }
}
