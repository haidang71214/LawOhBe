import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class FormItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  mainContent: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  uri_secure?: string;
}

export class FormListResponseDataDto {
  @ApiProperty({ type: [FormItemResponseDto] })
  data: FormItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ required: false })
  totalPages?: number;
}

export class FormResponseDto extends ResponseDto<FormItemResponseDto> {}
export class FormListResponseDto extends ResponseDto<FormListResponseDataDto> {}
