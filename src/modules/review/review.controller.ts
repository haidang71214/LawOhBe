import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto, ResponseDto, ReviewListResponseDataDto } from './dto';
import { AuthorizerDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('review')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('/lawyer/:lawyerId')
  @AuthorizerDecorator({ secured: true })
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @UserData() user: AuthorizedMetadata,
    @Param('lawyerId') lawyerId: string,
  ): Promise<ResponseDto<null>> {
    return this.reviewService.createReview(
      createReviewDto,
      lawyerId,
      user.userId,
    );
  }

  @Get('/lawyer/:lawyerId')
  async findReviewsByLawyer(
    @Param('lawyerId') lawyerId: string,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<ReviewListResponseDataDto>> {
    return this.reviewService.findReviewsByLawyer(lawyerId, queryDto);
  }
}
