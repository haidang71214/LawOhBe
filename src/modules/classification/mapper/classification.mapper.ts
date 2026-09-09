import { Injectable } from '@nestjs/common';
import { toDto } from 'libs/utils/mapper.util';
import { ClassificationDataDto } from '../dto';

@Injectable()
export class ClassificationMapper {
  toClassificationDataDto(data: {
    category: string;
    lawyers: any[];
  }): ClassificationDataDto {
    return toDto(ClassificationDataDto, data);
  }
}
