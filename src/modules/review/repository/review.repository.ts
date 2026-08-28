import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class ReviewRepository extends BaseRepository<Review> {
  constructor(
    @InjectModel(ReviewModelName) private readonly reviewModel: Model<Review>,
  ) {
    super(reviewModel);
  }

  async findByLawyerId(lawyerId: string): Promise<Review[]> {
    return this.find({ lawyer_id: lawyerId, isDeleted: { $ne: true } });
  }
}
