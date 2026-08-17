import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePriceRangeDto {
  @ApiProperty({ example: 100000 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  minPrice: number;

  @ApiProperty({ example: 5000000 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  maxPrice: number;

  @ApiProperty({ required: false, example: 'Khung giá dịch vụ bảo hiểm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  Type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;
}

export class UpdatePriceRangeRequestDto extends UpdatePriceRangeDto {}
