import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { ETypeLawyer } from 'libs/schemas';

export class CreateFormDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  formFile?: any;

  @ApiHideProperty()
  uri_secure: any;

  @ApiProperty({ enum: ETypeLawyer })
  type: ETypeLawyer;

  @ApiProperty()
  mainContent: string;

  @ApiProperty()
  description: string;
}

export class CreateFormRequestDto extends CreateFormDto {}
