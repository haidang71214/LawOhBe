import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class LawyerItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  phone?: number;

  @ApiProperty({ required: false })
  avartar_url?: string;

  @ApiProperty({ required: false })
  province?: string;

  @ApiProperty({ type: [String] })
  type_lawyer: string[];

  @ApiProperty({ type: [String] })
  sub_type_lawyers: string[];

  @ApiProperty()
  experienceYear: number;

  @ApiProperty({ type: [String] })
  certificate: string[];

  @ApiProperty({ required: false })
  stars?: number;
}

export class LawyerListResponseDataDto {
  @ApiProperty({ type: [LawyerItemResponseDto] })
  data: LawyerItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  page?: number;

  @ApiProperty({ required: false })
  limit?: number;

  @ApiProperty({ required: false })
  totalPages?: number;
}

export class LawyerResponseDto extends ResponseDto<LawyerItemResponseDto> {}
export class LawyerListResponseDto extends ResponseDto<LawyerListResponseDataDto> {}
