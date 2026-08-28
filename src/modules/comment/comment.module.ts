import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentDestination } from 'libs/schemas';
import { CommentRepository } from './repository/comment.repository';
import { CommentMapper } from './mapper/comment.mapper';

@Module({
  imports: [MongooseModule.forFeature([CommentDestination])],
  controllers: [CommentController],
  providers: [CommentService, CommentRepository, CommentMapper],
  exports: [CommentService, CommentRepository, CommentMapper],
})
export class CommentModule {}
