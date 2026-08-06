import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { ETypeLawyer } from 'libs/schemas';

export class CreateLawyerDto {
  @ApiProperty()
  description: string;

  @ApiProperty({
    description: 'List of lawyer specialization categories',
    isArray: true,
    enum: ETypeLawyer,
    type: String,
    example: ['INSURANCE', 'FAMILY'],
  })
  @IsArray()
  type_lawyer: ETypeLawyer[];

  @ApiProperty({
    type: [String],
    example: ['life insurance', 'contract consulting'],
    description: 'List of lawyer sub-specializations',
  })
  sub_type_lawyers: string[];

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  phone?: number;

  @ApiProperty({ required: false })
  age?: number;

  @ApiProperty({ required: false })
  province?: string;

  @ApiProperty({ required: false })
  avartar_url?: string;

  @ApiProperty({ required: false })
  experienceYear?: number;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Array of certificate image URLs',
  })
  @IsOptional()
  certificate?: string[];

  @ApiProperty({
    type: [String],
    format: 'binary',
    required: false,
    description: 'Upload certificate images (PNG, JPG, PDF, etc.)',
  })
  certificate_files?: any[];
}

export class CreateLawyerRequestDto extends CreateLawyerDto {}
