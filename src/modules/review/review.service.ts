import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto, ResponseDto, ReviewListResponseDataDto } from './dto';
import { UserModel, UserModelName } from 'libs/schemas';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { getDeletedFilter } from 'libs/utils/pagination.util';
import { RedisService, REDIS_TTL } from 'src/shared/redis';
import { ReviewRepository } from './repository/review.repository';
import { ReviewMapper } from './mapper/review.mapper';
import { BookingRepository } from '../booking/repository/booking.repository';

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly reviewMapper: ReviewMapper,
    private readonly bookingRepository: BookingRepository,
    @InjectModel(UserModelName) private UserModel: UserModel,
    private readonly redisService: RedisService,
  ) {}

  async createReview(
    createReviewDto: CreateReviewDto,
    lawyer_id: string,
    client_id: string,
  ): Promise<ResponseDto<null>> {
    const { rating, comment } = createReviewDto;

    const lawyer = await this.UserModel.findById(lawyer_id);
    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }

    // Check if client had a completed consultation with this lawyer
    const completedBooking = await this.bookingRepository.findOne({
      client_id,
      lawyer_id,
      status: { $in: ['done', 'paid'] },
      isDeleted: { $ne: true },
    });

    if (!completedBooking) {
      throw new BadRequestException(
        'You can only review lawyers after completing a consultation.',
      );
    }

    const newReview = await this.reviewRepository.create({
      client_id,
      lawyer_id,
      rating,
      comment,
      review_date: new Date(),
    });

    const reviews = await this.reviewRepository.findByLawyerId(lawyer_id);

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating =
      reviews.length > 0 ? totalRating / reviews.length : rating;
    const roundedAverageRating = Math.round(averageRating * 10) / 10;

    await this.UserModel.findByIdAndUpdate(lawyer_id, {
      $push: { reviews: (newReview as any)._id },
      star: roundedAverageRating,
    });

    // Invalidate reviews and lawyer cache
    await this.redisService.delByPattern(`cache:reviews:${lawyer_id}:*`);
    await this.redisService.delByPattern('cache:lawyers:*');

    return ResponseDto.success(
      null,
      'Lawyer review created successfully',
      HttpStatus.CREATED,
    );
  }

  async findReviewsByLawyer(
    lawyer_id: string,
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<ReviewListResponseDataDto>> {
    const cacheKey = `cache:reviews:${lawyer_id}:${JSON.stringify(queryDto || {})}`;
    const cached =
      await this.redisService.get<ReviewListResponseDataDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Reviews retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const filter: any = {
      lawyer_id,
      ...getDeletedFilter(queryDto?.status_deleted),
    };

    const { data, total } = await this.reviewRepository.findWithPagination(
      filter,
      page,
      limit,
      { createdAt: -1 },
      { path: 'client_id', model: 'User' },
    );

    const resultData = this.reviewMapper.toListResponseDto(
      data,
      total,
      page,
      limit,
    );

    await this.redisService.set(cacheKey, resultData, REDIS_TTL.FIVE_MINUTES);

    return ResponseDto.success(
      resultData,
      'Reviews retrieved successfully',
      HttpStatus.OK,
    );
  }
}
