import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Rating stars (1-5)', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class CreateReviewRequestDto extends CreateReviewDto {}
