import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ClassificationRequestDto {
  @ApiProperty({ description: 'Legal text to classify' })
  @IsString()
  @IsNotEmpty()
  text: string;
}
