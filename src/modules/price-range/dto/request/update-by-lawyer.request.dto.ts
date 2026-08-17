import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ETypeLawyer } from 'libs/schemas';

export class updatePriceBylawyerDto {
  @ApiProperty({ enum: ETypeLawyer })
  @IsNotEmpty()
  @IsString()
  Type: ETypeLawyer;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePriceByLawyerRequestDto extends updatePriceBylawyerDto {}
