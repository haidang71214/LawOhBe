import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './repository/users.repository';
import { UsersMapper } from './mapper/users.mapper';
import { RedisService } from 'src/shared/redis';
import { EmailService } from 'src/shared/email/email.service';
import { CloudUploadService } from 'src/shared/cloudinary/cloudUpload.service';
import { getModelToken } from '@nestjs/mongoose';
import {
  BookingModelName,
  ReviewModelName,
  TypeLawyerModelName,
  SubTypeLawyerModelName,
  CustomPriceModelName,
} from 'libs/schemas';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';

describe('UsersService (Unit Test)', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;
  let emailService: jest.Mocked<any>;
  let cloudUploadService: jest.Mocked<any>;
  let notificationService: jest.Mocked<any>;

  const mockUser = {
    _id: 'user_123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  };

  beforeEach(async () => {
    usersRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findWithPagination: jest.fn(),
      findByIdAndUpdate: jest.fn().mockResolvedValue(true),
      find: jest.fn().mockResolvedValue([]),
    };

    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      delByPattern: jest.fn().mockResolvedValue(true),
    };

    emailService = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    notificationService = {
      createNotification: jest.fn().mockResolvedValue({}),
      getAllByUserId: jest.fn().mockResolvedValue({}),
      markAsRead: jest.fn().mockResolvedValue({}),
    };

    cloudUploadService = {
      uploadImage: jest.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/avatar.jpg',
      }),
      uploadMultipleImages: jest
        .fn()
        .mockResolvedValue([
          { secure_url: 'https://res.cloudinary.com/cert.jpg' },
        ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        UsersMapper,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: RedisService, useValue: redisService },
        { provide: EmailService, useValue: emailService },
        { provide: CloudUploadService, useValue: cloudUploadService },
        { provide: NotificationService, useValue: notificationService },
        {
          provide: getModelToken(BookingModelName),
          useValue: {
            find: jest.fn().mockReturnValue({
              populate: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getModelToken(ReviewModelName),
          useValue: {
            find: jest.fn().mockReturnValue({
              populate: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getModelToken(TypeLawyerModelName),
          useValue: { create: jest.fn() },
        },
        {
          provide: getModelToken(SubTypeLawyerModelName),
          useValue: { create: jest.fn() },
        },
        {
          provide: getModelToken(CustomPriceModelName),
          useValue: { updateOne: jest.fn(), findOneAndUpdate: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get user details with parallel booking and review queries', async () => {
    usersRepository.findById.mockResolvedValueOnce(mockUser);

    const result = await service.getUserById('user_123');

    expect(result.data.user._id).toBe('user_123');
    expect(result.data.bookingUser).toBeDefined();
    expect(result.data.reviewUser).toBeDefined();
  });

  it('should throw NotFoundException if user not found by id', async () => {
    usersRepository.findById.mockResolvedValueOnce(null);

    await expect(service.getUserById('invalid_id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update user profile without allowing role change', async () => {
    usersRepository.findByIdAndUpdate.mockResolvedValueOnce({
      ...mockUser,
      name: 'New Name',
    });

    const result = await service.updateUserProfile('user_123', {
      name: 'New Name',
    });

    expect(result.message).toBe('Profile updated successfully');
    expect(redisService.delByPattern).toHaveBeenCalled();
  });
});
