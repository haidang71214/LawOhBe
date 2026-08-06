import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';

export class FilterLawyerDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by minimum stars' })
  @IsOptional()
  @IsNumber()
  stars?: number;

  @ApiPropertyOptional({ description: 'Filter by lawyer specialization type' })
  @IsOptional()
  @IsString()
  typeLawyer?: string;

  @ApiPropertyOptional({ description: 'Filter by province / location' })
  @IsOptional()
  @IsString()
  province?: string;
}

export class FilterLawyerRequestDto extends FilterLawyerDto {}
