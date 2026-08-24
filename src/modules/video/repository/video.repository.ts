import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Videos, VideosModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class VideoRepository extends BaseRepository<Videos> {
  constructor(
    @InjectModel(VideosModelName) private readonly videoModel: Model<Videos>,
  ) {
    super(videoModel);
  }
}
