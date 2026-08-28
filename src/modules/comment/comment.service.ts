import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto, ResponseDto, CommentItemResponseDto } from './dto';
import { RedisService } from 'src/shared/redis';
import { CommentRepository } from './repository/comment.repository';
import { CommentMapper } from './mapper/comment.mapper';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly commentMapper: CommentMapper,
    private readonly redisService: RedisService,
  ) {}

  async createComment(
    createCommentDto: CreateCommentDto,
    userId: string,
    videoId: string,
  ): Promise<ResponseDto<CommentItemResponseDto>> {
    const { content, parent_comment_id } = createCommentDto;
    const data = await this.commentRepository.create({
      user_id: userId,
      content,
      parent_comment_id: parent_comment_id || null,
      video_id: videoId,
    });

    // Invalidate video detail cache
    await this.redisService.del(`cache:videos:detail:${videoId}`);

    return ResponseDto.success(
      this.commentMapper.toResponseDto(data),
      'Comment created successfully',
      HttpStatus.CREATED,
    );
  }

  async removeComment(id: string, userId: string): Promise<ResponseDto<null>> {
    const data = await this.commentRepository.findOne({
      _id: id,
      user_id: userId,
    });

    if (!data) {
      throw new NotFoundException('Comment not found');
    }

    await Promise.all([
      this.commentRepository.updateMany(
        { parent_comment_id: (data as any)._id },
        { isDeleted: true, deletedAt: new Date() },
      ),
      this.commentRepository.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
      }),
    ]);

    // Invalidate video detail cache
    await this.redisService.delByPattern('cache:videos:*');

    return ResponseDto.success(
      null,
      'Comment deleted successfully',
      HttpStatus.OK,
    );
  }
}
