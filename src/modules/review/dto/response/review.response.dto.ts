import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class ReviewItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  lawyer_id: string;

  @ApiProperty()
  client_id: any;

  @ApiProperty({ required: false })
  booking_id?: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  comment: string;

  @ApiProperty({ required: false })
  review_date?: Date;

  @ApiProperty({ required: false })
  isDeleted?: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class ReviewListResponseDataDto {
  @ApiProperty({ type: [ReviewItemResponseDto] })
  data: ReviewItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  page?: number;

  @ApiProperty({ required: false })
  limit?: number;

  @ApiProperty({ required: false })
  totalPages?: number;
}

export class ReviewResponseDto extends ResponseDto<ReviewItemResponseDto> {}
export class ReviewListResponseDto extends ResponseDto<ReviewListResponseDataDto> {}
