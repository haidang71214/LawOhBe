import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class MarketPriceRangeItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  Type: string;

  @ApiProperty()
  minPrice: number;

  @ApiProperty()
  maxPrice: number;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  isDeleted?: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class CustomPriceItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  lawyerId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  Type: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  isDeleted?: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class MarketPriceRangeListResponseDataDto {
  @ApiProperty({ type: [MarketPriceRangeItemResponseDto] })
  data: MarketPriceRangeItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  page?: number;

  @ApiProperty({ required: false })
  limit?: number;

  @ApiProperty({ required: false })
  totalPages?: number;
}

export class PriceRangeResponseDto extends ResponseDto<
  MarketPriceRangeItemResponseDto | CustomPriceItemResponseDto
> {}
export class PriceRangeListResponseDto extends ResponseDto<MarketPriceRangeListResponseDataDto> {}
