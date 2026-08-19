import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { BookingRepository } from './repository/booking.repository';
import { BookingMapper } from './mapper/booking.mapper';
import { EmailService } from 'src/shared/email/email.service';
import { RedisService } from 'src/shared/redis';
import { getModelToken } from '@nestjs/mongoose';
import { UserModelName, CustomPriceModelName, ETypeLawyer } from 'libs/schemas';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';

describe('BookingService (Unit Test)', () => {
  let service: BookingService;
  let bookingRepository: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;
  let customPriceModel: jest.Mocked<any>;
  let notificationService: jest.Mocked<any>;

  const mockLawyerId = '65f12345678901234567890a';
  const mockUserId = '65f12345678901234567890b';

  beforeEach(async () => {
    bookingRepository = {
      create: jest.fn(),
      findConflictingBooking: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findWithPagination: jest.fn(),
    };

    redisService = {
      acquireLock: jest.fn().mockResolvedValue(true),
      releaseLock: jest.fn().mockResolvedValue(true),
      delByPattern: jest.fn().mockResolvedValue(true),
    };

    notificationService = {
      createNotification: jest.fn().mockResolvedValue({}),
      getAllByUserId: jest.fn().mockResolvedValue({}),
      markAsRead: jest.fn().mockResolvedValue({}),
    };

    customPriceModel = {
      findOne: jest.fn().mockResolvedValue({
        lawyer_id: mockLawyerId,
        type: ETypeLawyer.CIVIL,
        price: 200000,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        BookingMapper,
        { provide: BookingRepository, useValue: bookingRepository },
        { provide: RedisService, useValue: redisService },
        {
          provide: EmailService,
          useValue: { sendMail: jest.fn().mockResolvedValue(true) },
        },
        { provide: NotificationService, useValue: notificationService },
        {
          provide: getModelToken(UserModelName),
          useValue: {
            findById: jest.fn().mockResolvedValue({
              _id: mockUserId,
              name: 'Test User',
              email: 'test@example.com',
            }),
          },
        },
        {
          provide: getModelToken(CustomPriceModelName),
          useValue: customPriceModel,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException if redis lock cannot be acquired (concurrency protection)', async () => {
    redisService.acquireLock.mockResolvedValueOnce(false);

    await expect(
      service.create(
        {
          lawyer_id: mockLawyerId,
          booking_start: new Date(Date.now() + 86400000),
          booking_end: new Date(Date.now() + 90000000),
          typeBooking: ETypeLawyer.CIVIL,
        },
        mockUserId,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw BadRequestException if end date is before or equal start date', async () => {
    const now = new Date(Date.now() + 86400000);

    await expect(
      service.create(
        {
          lawyer_id: mockLawyerId,
          booking_start: now,
          booking_end: new Date(now.getTime() - 3600000),
          typeBooking: ETypeLawyer.CIVIL,
        },
        mockUserId,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw ConflictException if lawyer already has a booking at that time slot', async () => {
    bookingRepository.findConflictingBooking.mockResolvedValueOnce({
      _id: 'existing_booking_id',
    });

    const start = new Date(Date.now() + 86400000);
    const end = new Date(start.getTime() + 3600000);

    await expect(
      service.create(
        {
          lawyer_id: mockLawyerId,
          booking_start: start,
          booking_end: end,
          typeBooking: ETypeLawyer.CIVIL,
        },
        mockUserId,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should calculate hourly price and create booking successfully', async () => {
    const start = new Date(Date.now() + 86400000);
    const end = new Date(start.getTime() + 2 * 3600000); // 2 hours

    bookingRepository.findConflictingBooking.mockResolvedValueOnce(null);
    bookingRepository.create.mockResolvedValueOnce({
      _id: 'booking_123',
      client_id: mockUserId,
      lawyer_id: mockLawyerId,
      booking_start: start,
      booking_end: end,
      typeBooking: ETypeLawyer.CIVIL,
      amount: 400000,
      income: 400000,
      status: 'pending',
    });

    const result = await service.create(
      {
        lawyer_id: mockLawyerId,
        booking_start: start,
        booking_end: end,
        typeBooking: ETypeLawyer.CIVIL,
      },
      mockUserId,
    );

    expect(result.data!.amount).toBe(400000);
    expect(result.data!.status).toBe('pending');
    expect(redisService.releaseLock).toHaveBeenCalled();
  });

  it('should only allow cancelling pending bookings', async () => {
    bookingRepository.findOne.mockResolvedValueOnce({
      _id: 'booking_123',
      client_id: mockUserId,
      status: 'paid', // already paid, cannot cancel directly
    });

    await expect(
      service.cancelBooking(mockUserId, 'booking_123'),
    ).rejects.toThrow(ConflictException);
  });
});
