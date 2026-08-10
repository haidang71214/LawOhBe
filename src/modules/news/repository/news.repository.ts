import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { New, NewModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class NewsRepository extends BaseRepository<New> {
  constructor(
    @InjectModel(NewModelName) private readonly newsModel: Model<New>,
  ) {
    super(newsModel);
  }
}
