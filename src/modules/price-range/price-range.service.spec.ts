import { Test, TestingModule } from '@nestjs/testing';
import { PriceRangeService } from './price-range.service';
import { PriceRangeRepository } from './repository/price-range.repository';
import { CustomPriceRepository } from '../lawyer/repository/custom-price.repository';
import { BookingRepository } from '../booking/repository/booking.repository';
import { PriceRangeMapper } from './mapper/price-range.mapper';
import { RedisService } from 'src/shared/redis';
import { BadRequestException } from '@nestjs/common';

describe('PriceRangeService (Unit Test)', () => {
  let service: PriceRangeService;
  let priceRangeRepository: jest.Mocked<any>;
  let customPriceRepository: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;

  beforeEach(async () => {
    priceRangeRepository = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn().mockResolvedValue({
        type: 'CIVIL',
        minPrice: 100000,
        maxPrice: 500000,
      }),
      find: jest.fn(),
      create: jest.fn(),
    };

    customPriceRepository = {
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
      find: jest.fn(),
    };

    redisService = {
      delByPattern: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceRangeService,
        PriceRangeMapper,
        { provide: PriceRangeRepository, useValue: priceRangeRepository },
        { provide: CustomPriceRepository, useValue: customPriceRepository },
        { provide: BookingRepository, useValue: { find: jest.fn() } },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<PriceRangeService>(PriceRangeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException if maxPrice is <= minPrice', async () => {
    await expect(
      service.updateMarketPriceRange(
        'CIVIL',
        { minPrice: 500000, maxPrice: 300000, description: 'invalid' },
        'admin_1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should batch update custom prices exceeding range and update market price range', async () => {
    const result = await service.updateMarketPriceRange(
      'CIVIL',
      {
        minPrice: 100000,
        maxPrice: 500000,
        description: 'Updated civil range',
      },
      'admin_1',
    );

    expect(customPriceRepository.updateMany).toHaveBeenCalledTimes(2);
    expect(priceRangeRepository.findOneAndUpdate).toHaveBeenCalled();
    expect(result.data.maxPrice).toBe(500000);
  });
});
