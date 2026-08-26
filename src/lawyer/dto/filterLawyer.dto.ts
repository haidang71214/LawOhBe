import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterLawyerDto {
  @IsOptional()
  @IsNumber()
  // @Type(() => Number) // Chuyển đổi chuỗi thành số
  stars?: number;

  @IsOptional()
  @IsString()
  typeLawyer?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Chuyển đổi chuỗi thành số
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Chuyển đổi chuỗi thành số
  limit?: number;
}