import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ETypeLawyer } from 'libs/schemas';

export class RequestLawyerRoleDto {
  @ApiProperty({
    description: 'Self introduction and professional experience summary',
    example: 'Luat su voi 5 nam kinh nghiem...',
  })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Years of legal experience',
    example: 5,
  })
  @IsNotEmpty({ message: 'Experience years is required' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Experience years must be a number' })
  @Min(0, { message: 'Experience years cannot be negative' })
  experienceYear: number;

  @ApiProperty({
    description: 'List of lawyer specialization categories',
    isArray: true,
    enum: ETypeLawyer,
    type: String,
    example: ['CIVIL', 'CORPORATE'],
    required: false,
  })
  @IsOptional()
  type_lawyer?: any;

  @ApiProperty({
    type: [String],
    example: ['tranh tụng dân sự', 'tư vấn hợp đồng'],
    description: 'List of lawyer sub-specializations',
    required: false,
  })
  @IsOptional()
  sub_type_lawyers?: any;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'List of existing certificate image URLs',
  })
  @IsOptional()
  certificate?: any;

  @ApiProperty({
    type: [String],
    format: 'binary',
    required: false,
    description: 'Upload certificate/degree image files (PNG, JPG, PDF, etc.)',
  })
  certificate_files?: any[];
}

export class RequestLawyerRoleRequestDto extends RequestLawyerRoleDto {}
