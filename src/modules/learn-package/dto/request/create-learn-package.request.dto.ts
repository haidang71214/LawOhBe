import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLearnPackageDto {
  @ApiProperty({
    description: 'Learning package name',
    example: 'Basic Corporate Law Package',
  })
  @IsNotEmpty({ message: 'Package name is required' })
  @IsString({ message: 'Package name must be a string' })
  name: string;

  @ApiProperty({ description: 'Package price (VND)', example: 500000 })
  @IsNotEmpty({ message: 'Package price is required' })
  @IsNumber({}, { message: 'Package price must be a number' })
  @Min(0, { message: 'Package price cannot be negative' })
  price: number;

  @ApiPropertyOptional({
    description: 'Package tier',
    enum: ['none', 'standard', 'gold', 'deluxe'],
    default: 'none',
  })
  @IsOptional()
  @IsEnum(['none', 'standard', 'gold', 'deluxe'], {
    message: 'Invalid package tier',
  })
  type?: string;

  @ApiPropertyOptional({ description: 'Detailed package description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Course start date' })
  @IsOptional()
  learn_start?: Date;

  @ApiPropertyOptional({ description: 'Course end date' })
  @IsOptional()
  learn_end?: Date;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsOptional()
  is_active?: boolean;
}

export class CreateLearnPackageRequestDto extends CreateLearnPackageDto {}
