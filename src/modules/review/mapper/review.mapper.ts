import { Injectable } from '@nestjs/common';
import { Review } from 'libs/schemas';
import { toDto, toDtoList } from 'libs/utils/mapper.util';
import { ReviewItemResponseDto, ReviewListResponseDataDto } from '../dto';

@Injectable()
export class ReviewMapper {
  toResponseDto(review: Review): ReviewItemResponseDto {
    return toDto(ReviewItemResponseDto, review);
  }

  toListResponseDto(
    reviews: Review[],
    total: number,
    page: number,
    limit: number,
  ): ReviewListResponseDataDto {
    return {
      data: toDtoList(ReviewItemResponseDto, reviews),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
