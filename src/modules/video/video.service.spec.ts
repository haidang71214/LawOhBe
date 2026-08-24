import { Test, TestingModule } from '@nestjs/testing';
import { VideoService } from './video.service';
import { VideoRepository } from './repository/video.repository';
import { VideoMapper } from './mapper/video.mapper';
import { RedisService } from 'src/shared/redis';
import { getModelToken } from '@nestjs/mongoose';
import { CommentModelName, UserModelName } from 'libs/schemas';
import { EmailService } from 'src/shared/email/email.service';
import { NotificationService } from '../notification/notification.service';
import { UsersService } from '../users/users.service';

describe('VideoService (Unit Test)', () => {
  let service: VideoService;
  let videoRepository: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;

  beforeEach(async () => {
    videoRepository = {
      create: jest.fn(),
      findWithPagination: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      delByPattern: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        VideoMapper,
        { provide: VideoRepository, useValue: videoRepository },
        { provide: getModelToken(CommentModelName), useValue: {} },
        { provide: getModelToken(UserModelName), useValue: {} },
        { provide: EmailService, useValue: { sendMail: jest.fn() } },
        { provide: RedisService, useValue: redisService },
        {
          provide: NotificationService,
          useValue: { createNotification: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: UsersService,
          useValue: { adminIdGetter: jest.fn().mockResolvedValue('admin_123') },
        },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
