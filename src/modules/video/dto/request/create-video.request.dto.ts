import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VideoLawCategory } from 'libs/schemas';

export class CreateVideoDto {
  @ApiProperty({
    enum: VideoLawCategory,
  })
  @IsNotEmpty()
  categories: VideoLawCategory;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  thubnail?: any;

  @ApiHideProperty()
  @IsOptional()
  @IsString()
  thubnail_url?: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  video?: any;

  @ApiHideProperty()
  @IsOptional()
  @IsString()
  video_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateVideoRequestDto extends CreateVideoDto {}
