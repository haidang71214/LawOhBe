import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { ETypeLawyer } from 'libs/schemas';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({ enum: ETypeLawyer })
  @IsNotEmpty({ message: 'Type is required' })
  @IsEnum(ETypeLawyer, { message: 'Invalid news type' })
  type: ETypeLawyer;

  @ApiProperty()
  @IsNotEmpty({ message: 'Main title is required' })
  @IsString({ message: 'Main title must be a string' })
  mainTitle: string;

  @ApiProperty({ type: String })
  @IsNotEmpty({ message: 'Content is required' })
  @IsString({ message: 'Content must be a string' })
  content: string;

  @ApiHideProperty()
  @IsOptional()
  image_urls?: string[];

  @ApiProperty({ type: [String], format: 'binary', required: false })
  @IsOptional()
  imgs?: any[];
}

export class CreateNewsRequestDto extends CreateNewsDto {}
