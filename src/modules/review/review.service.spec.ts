import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { ReviewRepository } from './repository/review.repository';
import { ReviewMapper } from './mapper/review.mapper';
import { BookingRepository } from '../booking/repository/booking.repository';
import { RedisService } from 'src/shared/redis';
import { getModelToken } from '@nestjs/mongoose';
import { UserModelName } from 'libs/schemas';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ReviewService (Unit Test)', () => {
  let service: ReviewService;
  let reviewRepository: jest.Mocked<any>;
  let bookingRepository: jest.Mocked<any>;
  let userModel: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;

  const mockLawyerId = '65f12345678901234567890a';
  const mockClientId = '65f12345678901234567890b';

  beforeEach(async () => {
    reviewRepository = {
      create: jest.fn(),
      findByLawyerId: jest.fn(),
      findWithPagination: jest.fn(),
    };

    bookingRepository = {
      findOne: jest.fn(),
    };

    userModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn().mockResolvedValue(true),
    };

    redisService = {
      delByPattern: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        ReviewMapper,
        { provide: ReviewRepository, useValue: reviewRepository },
        { provide: BookingRepository, useValue: bookingRepository },
        { provide: getModelToken(UserModelName), useValue: userModel },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if lawyer is not found', async () => {
    userModel.findById.mockResolvedValueOnce(null);

    await expect(
      service.createReview(
        { rating: 5, comment: 'Great lawyer' },
        mockLawyerId,
        mockClientId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if client has no completed/paid consultation with this lawyer (spam prevention)', async () => {
    userModel.findById.mockResolvedValueOnce({ _id: mockLawyerId });
    bookingRepository.findOne.mockResolvedValueOnce(null); // no completed booking

    await expect(
      service.createReview(
        { rating: 5, comment: 'Spam review' },
        mockLawyerId,
        mockClientId,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create review and update lawyer average rating correctly (Math.round 1 decimal)', async () => {
    userModel.findById.mockResolvedValueOnce({ _id: mockLawyerId });
    bookingRepository.findOne.mockResolvedValueOnce({
      _id: 'booking_123',
      status: 'paid',
    });
    reviewRepository.create.mockResolvedValueOnce({
      _id: 'review_1',
      rating: 4,
    });
    reviewRepository.findByLawyerId.mockResolvedValueOnce([
      { rating: 4 },
      { rating: 5 },
      { rating: 4 },
    ]); // (4 + 5 + 4) / 3 = 4.3333 -> 4.3

    const result = await service.createReview(
      { rating: 4, comment: 'Good service' },
      mockLawyerId,
      mockClientId,
    );

    expect(result.message).toBe('Lawyer review created successfully');
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockLawyerId,
      expect.objectContaining({
        star: 4.3,
      }),
    );
  });
});
