import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class ClassificationDataDto {
  @ApiProperty()
  category: string;

  @ApiProperty({ type: [Object], required: false })
  lawyers: any[];
}

export class ClassificationResponseDto extends ResponseDto<ClassificationDataDto> {}
export class ClassificationCategoriesResponseDto extends ResponseDto<{
  categories: string[];
}> {}
