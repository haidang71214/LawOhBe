import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class CommentRepository extends BaseRepository<Comment> {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
  ) {
    super(commentModel);
  }
}
