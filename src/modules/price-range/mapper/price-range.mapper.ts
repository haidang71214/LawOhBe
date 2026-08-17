import { Injectable } from '@nestjs/common';
import { MarketPriceRange } from 'libs/schemas';
import {
  MarketPriceRangeItemResponseDto,
  MarketPriceRangeListResponseDataDto,
} from '../dto';

@Injectable()
export class PriceRangeMapper {
  toResponseDto(
    priceRange: MarketPriceRange | any,
  ): MarketPriceRangeItemResponseDto {
    const raw =
      priceRange && typeof (priceRange as any).toObject === 'function'
        ? (priceRange as any).toObject({ virtuals: true })
        : priceRange;
    if (!raw) return null as any;

    const typeVal = raw.type || raw.Type;

    return {
      _id: raw._id?.toString?.() || raw._id,
      type: typeVal,
      Type: typeVal,
      minPrice: raw.minPrice,
      maxPrice: raw.maxPrice,
      description: raw.description,
      isDeleted: raw.isDeleted,
      createdAt: raw.createdAt,
    };
  }

  toListResponseDto(
    priceRanges: MarketPriceRange[],
    total: number,
    page: number,
    limit: number,
  ): MarketPriceRangeListResponseDataDto {
    return {
      data: (priceRanges || []).map((item) => this.toResponseDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
