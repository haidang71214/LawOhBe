import { Injectable } from '@nestjs/common';
import { User } from 'libs/schemas';
import { toDto, toDtoList } from 'libs/utils/mapper.util';
import { LawyerItemResponseDto, LawyerListResponseDataDto } from '../dto';

@Injectable()
export class LawyerMapper {
  toResponseDto(lawyer: any): LawyerItemResponseDto {
    return toDto(LawyerItemResponseDto, lawyer);
  }

  toListResponseDto(
    lawyers: User[],
    total: number,
    page: number,
    limit: number,
  ): LawyerListResponseDataDto {
    return {
      data: toDtoList(LawyerItemResponseDto, lawyers),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
