import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class NewsItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  mainTitle: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String] })
  image_urls: string[];

  @ApiProperty({ enum: ['pending', 'accept', 'reject'], required: false })
  status?: string;

  @ApiProperty({ required: false })
  isAccept?: boolean;

  @ApiProperty({ required: false })
  rejectReason?: string;

  @ApiProperty({ required: false })
  userId?: any;

  @ApiProperty({ required: false })
  isDeleted?: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class NewsListResponseDataDto {
  @ApiProperty({ type: [NewsItemResponseDto] })
  data: NewsItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  page?: number;

  @ApiProperty({ required: false })
  limit?: number;

  @ApiProperty({ required: false })
  totalPages?: number;
}

export class NewsResponseDto extends ResponseDto<NewsItemResponseDto> {}
export class NewsListResponseDto extends ResponseDto<NewsListResponseDataDto> {}
