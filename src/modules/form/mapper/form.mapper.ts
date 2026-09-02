import { Injectable } from '@nestjs/common';
import { Form } from 'libs/schemas';
import { toDto, toDtoList } from 'libs/utils/mapper.util';
import { FormItemResponseDto, FormListResponseDataDto } from '../dto';

@Injectable()
export class FormMapper {
  toResponseDto(form: Form): FormItemResponseDto {
    return toDto(FormItemResponseDto, form);
  }

  toListResponseDto(
    forms: Form[],
    total: number,
    page: number,
    limit: number,
  ): FormListResponseDataDto {
    return {
      data: toDtoList(FormItemResponseDto, forms),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
