import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';

export class FindAllFormDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by form type' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class FindAllFormRequestDto extends FindAllFormDto {}
