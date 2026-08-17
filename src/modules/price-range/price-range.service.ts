import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  UpdatePriceRangeDto,
  CustomPriceRangeDto,
  updatePriceBylawyerDto,
  ResponseDto,
  MarketPriceRangeItemResponseDto,
  CustomPriceItemResponseDto,
  MarketPriceRangeListResponseDataDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { getDeletedFilter } from 'libs/utils/pagination.util';
import { toDto } from 'libs/utils/mapper.util';
import { RedisService, REDIS_TTL } from 'src/shared/redis';
import { PriceRangeRepository } from './repository/price-range.repository';
import { PriceRangeMapper } from './mapper/price-range.mapper';
import { CustomPriceRepository } from '../lawyer/repository/custom-price.repository';
import { BookingRepository } from '../booking/repository/booking.repository';

@Injectable()
export class PriceRangeService {
  constructor(
    private readonly priceRangeRepository: PriceRangeRepository,
    private readonly priceRangeMapper: PriceRangeMapper,
    private readonly customPriceRepository: CustomPriceRepository,
    private readonly bookingRepository: BookingRepository,
    private readonly redisService: RedisService,
  ) {}

  async createCustomPrice(
    userId: string,
    body: CustomPriceRangeDto,
  ): Promise<ResponseDto<CustomPriceItemResponseDto>> {
    const { Type, price, description } = body;
    const normalizedType = Type?.trim()?.toUpperCase();
    const checkPrice = await this.priceRangeRepository.findOne({
      type: normalizedType as any,
    });

    const numericPrice = Number(price);

    if (
      checkPrice &&
      numericPrice >= checkPrice.minPrice &&
      numericPrice <= checkPrice.maxPrice
    ) {
      const result = await this.customPriceRepository.findOneAndUpdate(
        { lawyer_id: userId, type: normalizedType },
        {
          $set: {
            lawyer_id: userId,
            type: normalizedType,
            price: numericPrice,
            description,
          },
        },
        { upsert: true, new: true },
      );

      // Invalidate cache
      await this.redisService.delByPattern('cache:price_range:*');
      await this.redisService.delByPattern('cache:lawyers:*');

      const raw =
        result && typeof (result as any).toObject === 'function'
          ? (result as any).toObject({ virtuals: true })
          : result;
      const typeVal = raw?.type || raw?.Type || normalizedType;

      return ResponseDto.success(
        {
          _id: raw?._id?.toString?.() || raw?._id,
          lawyerId: raw?.lawyer_id?.toString?.() || raw?.lawyerId || userId,
          type: typeVal,
          Type: typeVal,
          price: raw?.price,
          description: raw?.description,
          isDeleted: raw?.isDeleted,
          createdAt: raw?.createdAt,
        } as CustomPriceItemResponseDto,
        'Custom price configured successfully',
        HttpStatus.OK,
      );
    }
    const formattedMinPrice = checkPrice?.minPrice?.toLocaleString('en-US');
    const formattedMaxPrice = checkPrice?.maxPrice?.toLocaleString('en-US');
    throw new BadRequestException(
      `Price must be between ${formattedMinPrice} VND and ${formattedMaxPrice} VND`,
    );
  }

  async findAllPriceRanges(
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<MarketPriceRangeListResponseDataDto>> {
    const cacheKey = `cache:price_range:list:${JSON.stringify(queryDto || {})}`;
    const cached =
      await this.redisService.get<MarketPriceRangeListResponseDataDto>(
        cacheKey,
      );
    if (cached) {
      return ResponseDto.success(
        cached,
        'Market price ranges retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);
    const filter = getDeletedFilter(queryDto?.status_deleted);

    const { data: results, total } =
      await this.priceRangeRepository.findWithPagination(filter, page, limit);

    const resultData = this.priceRangeMapper.toListResponseDto(
      results,
      total,
      page,
      limit,
    );

    await this.redisService.set(
      cacheKey,
      resultData,
      REDIS_TTL.FIFTEEN_MINUTES,
    );

    return ResponseDto.success(
      resultData,
      'Market price ranges retrieved successfully',
      HttpStatus.OK,
    );
  }

  async findPriceRangeByType(
    id: string,
  ): Promise<ResponseDto<MarketPriceRangeItemResponseDto>> {
    const normalizedType = id?.trim()?.toUpperCase();
    const cacheKey = `cache:price_range:detail:${normalizedType}`;
    const cached =
      await this.redisService.get<MarketPriceRangeItemResponseDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Market price range details retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const response = await this.priceRangeRepository.findOne({
      type: normalizedType as any,
    });
    if (!response) {
      throw new NotFoundException('Market price range not found');
    }

    const result = this.priceRangeMapper.toResponseDto(response);
    await this.redisService.set(cacheKey, result, REDIS_TTL.FIFTEEN_MINUTES);

    return ResponseDto.success(
      result,
      'Market price range details retrieved successfully',
      HttpStatus.OK,
    );
  }

  async updateMarketPriceRange(
    type: string,
    updatePriceRangeDto: UpdatePriceRangeDto,
    userId: string,
  ): Promise<ResponseDto<any>> {
    const minPrice = Number(updatePriceRangeDto.minPrice);
    const maxPrice = Number(updatePriceRangeDto.maxPrice);

    if (isNaN(minPrice) || isNaN(maxPrice)) {
      throw new BadRequestException(
        'Minimum price and maximum price must be valid numbers',
      );
    }

    if (maxPrice <= minPrice) {
      throw new BadRequestException(
        'Minimum price cannot be greater than or equal to maximum price',
      );
    }
    const normalizedType = type?.trim()?.toUpperCase();

    // 1. Batch update CustomPrices that exceed maxPrice or are below minPrice
    await Promise.all([
      this.customPriceRepository.updateMany(
        { type: normalizedType, price: { $gt: maxPrice } },
        { price: maxPrice },
      ),
      this.customPriceRepository.updateMany(
        { type: normalizedType, price: { $lt: minPrice } },
        { price: minPrice },
      ),
    ]);

    // 2. Update or insert MarketPriceRange document
    const updated = await this.priceRangeRepository.findOneAndUpdate(
      { type: normalizedType },
      {
        $set: {
          type: normalizedType,
          minPrice,
          maxPrice,
          description: updatePriceRangeDto.description,
        },
      },
      { new: true, upsert: true },
    );

    // Invalidate cache
    await this.redisService.delByPattern('cache:price_range:*');
    await this.redisService.delByPattern('cache:lawyers:*');

    const result = this.priceRangeMapper.toResponseDto(updated);

    return ResponseDto.success(
      result,
      'Price range updated successfully',
      HttpStatus.OK,
    );
  }

  async updateCustomPrice(
    userId: string,
    body: updatePriceBylawyerDto,
  ): Promise<ResponseDto<CustomPriceItemResponseDto>> {
    const { Type, price, description } = body;
    const normalizedType = Type?.trim()?.toUpperCase();
    const checkPrice = await this.priceRangeRepository.findOne({
      type: normalizedType as any,
    });

    const numericPrice = Number(price);

    if (
      checkPrice &&
      numericPrice >= checkPrice.minPrice &&
      numericPrice <= checkPrice.maxPrice
    ) {
      const result = await this.customPriceRepository.findOneAndUpdate(
        {
          type: normalizedType,
          lawyer_id: userId,
        },
        {
          $set: {
            type: normalizedType,
            lawyer_id: userId,
            price: numericPrice,
            description,
          },
        },
        { new: true, upsert: true },
      );

      // Invalidate cache
      await this.redisService.delByPattern('cache:price_range:*');
      await this.redisService.delByPattern('cache:lawyers:*');

      const raw =
        result && typeof (result as any).toObject === 'function'
          ? (result as any).toObject({ virtuals: true })
          : result;
      const typeVal = raw?.type || raw?.Type || normalizedType;

      return ResponseDto.success(
        {
          _id: raw?._id?.toString?.() || raw?._id,
          lawyerId: raw?.lawyer_id?.toString?.() || raw?.lawyerId || userId,
          type: typeVal,
          Type: typeVal,
          price: raw?.price,
          description: raw?.description,
          isDeleted: raw?.isDeleted,
          createdAt: raw?.createdAt,
        } as CustomPriceItemResponseDto,
        'Custom price updated successfully',
        HttpStatus.OK,
      );
    }
    const formattedMinPrice = checkPrice?.minPrice?.toLocaleString('en-US');
    const formattedMaxPrice = checkPrice?.maxPrice?.toLocaleString('en-US');
    throw new BadRequestException(
      `Price must be between ${formattedMinPrice} and ${formattedMaxPrice}`,
    );
  }
}
