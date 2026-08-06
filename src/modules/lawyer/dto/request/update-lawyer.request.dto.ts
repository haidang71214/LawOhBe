import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { ETypeLawyer } from 'libs/schemas';

export class UpdateLawyerDto {
  @ApiProperty({ required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'List of lawyer specialization categories',
    isArray: true,
    enum: ETypeLawyer,
    type: String,
    example: ['INSURANCE', 'FAMILY'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  type_lawyer?: ETypeLawyer[];

  @ApiProperty({
    type: [String],
    example: ['life insurance', 'marriage consultation'],
    description: 'List of lawyer sub-specializations',
    required: false,
  })
  @IsOptional()
  sub_type_lawyers?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  experienceYear?: number;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Existing or newly added certificate image URLs',
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

export class UpdateLawyerRequestDto extends UpdateLawyerDto {}
