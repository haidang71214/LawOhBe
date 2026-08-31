import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class LearnPackageItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  type: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  learn_start?: Date;

  @ApiProperty({ required: false })
  learn_end?: Date;

  @ApiProperty()
  is_active: boolean;
}

export class LearnPackageListResponseDataDto {
  @ApiProperty({ type: [LearnPackageItemResponseDto] })
  data: LearnPackageItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  page?: number;

  @ApiProperty({ required: false })
  limit?: number;

  @ApiProperty({ required: false })
  totalPages?: number;
}

export class LearnPackageResponseDto extends ResponseDto<LearnPackageItemResponseDto> {}
export class LearnPackageListResponseDto extends ResponseDto<LearnPackageListResponseDataDto> {}
