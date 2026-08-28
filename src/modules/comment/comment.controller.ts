import { Controller, Post, Body, Param, Delete } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto, ResponseDto, CommentItemResponseDto } from './dto';
import { AuthorizerDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('comment')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('/video/:videoId')
  @AuthorizerDecorator({ secured: true })
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @UserData() user: AuthorizedMetadata,
    @Param('videoId') videoId: string,
  ): Promise<ResponseDto<CommentItemResponseDto>> {
    return this.commentService.createComment(
      createCommentDto,
      user.userId,
      videoId,
    );
  }

  @Delete('/:id')
  @AuthorizerDecorator({ secured: true })
  async removeComment(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<null>> {
    return this.commentService.removeComment(id, user.userId);
  }
}
