import { Injectable } from '@nestjs/common';
import { LearnPackage } from 'libs/schemas';
import { toDto, toDtoList } from 'libs/utils/mapper.util';
import {
  LearnPackageItemResponseDto,
  LearnPackageListResponseDataDto,
} from '../dto';

@Injectable()
export class LearnPackageMapper {
  toResponseDto(pack: LearnPackage): LearnPackageItemResponseDto {
    return toDto(LearnPackageItemResponseDto, pack);
  }

  toListResponseDto(
    packages: LearnPackage[],
    total: number,
    page: number,
    limit: number,
  ): LearnPackageListResponseDataDto {
    return {
      data: toDtoList(LearnPackageItemResponseDto, packages),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
