import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';
import { NewsRepository } from './repository/news.repository';
import { NewsMapper } from './mapper/news.mapper';
import { RedisService } from 'src/shared/redis';
import { NotificationService } from '../notification/notification.service';
import { EmailService } from 'src/shared/email/email.service';
import { getModelToken } from '@nestjs/mongoose';
import { ENewsStatus, UserModelName } from 'libs/schemas';
import { ETypeLawyer } from 'libs/schemas/enums';
import { Types } from 'mongoose';
import { AcceptRejectAction } from 'libs/constant';

describe('NewsService (Unit Test)', () => {
  let service: NewsService;
  let newsRepository: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;
  let notificationService: jest.Mocked<any>;
  let emailService: jest.Mocked<any>;
  let userModel: jest.Mocked<any>;

  beforeEach(async () => {
    newsRepository = {
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

    notificationService = {
      createNotification: jest.fn().mockResolvedValue({}),
    };

    emailService = {
      sendMail: jest.fn().mockResolvedValue({}),
    };

    userModel = {
      findById: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        name: 'Lawyer Test',
        email: 'lawyer@test.com',
      }),
      find: jest.fn().mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          name: 'Admin Test',
          email: 'admin@test.com',
          role: 'admin',
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        NewsMapper,
        { provide: NewsRepository, useValue: newsRepository },
        { provide: RedisService, useValue: redisService },
        { provide: NotificationService, useValue: notificationService },
        { provide: EmailService, useValue: emailService },
        { provide: getModelToken(UserModelName), useValue: userModel },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNews', () => {
    it('should create news with status pending, send notification and email to admin users', async () => {
      const mockUserId = new Types.ObjectId().toString();
      const mockCreatedNews = {
        _id: new Types.ObjectId(),
        mainTitle: 'Luật đất đai mới',
        content: 'Nội dung chi tiết...',
        type: ETypeLawyer.CIVIL,
        image_url: ['https://example.com/image.jpg'],
        userId: new Types.ObjectId(mockUserId),
        status: ENewsStatus.PENDING,
        isAccept: false,
      };

      newsRepository.create.mockResolvedValue(mockCreatedNews);

      const result = await service.createNews(
        {
          mainTitle: 'Luật đất đai mới',
          content: 'Nội dung chi tiết...',
          type: ETypeLawyer.CIVIL,
          image_urls: ['https://example.com/image.jpg'],
        },
        mockUserId,
      );

      expect(result.data?.mainTitle).toBe('Luật đất đai mới');
      expect(newsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ENewsStatus.PENDING,
          isAccept: false,
        }),
      );
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'NEWS_PENDING',
          title: 'New Article Pending Approval',
        }),
      );
      expect(emailService.sendMail).toHaveBeenCalledWith(
        'admin@test.com',
        expect.stringContaining('New News Article Needs Review'),
        expect.any(String),
      );
    });
  });

  describe('approveNews', () => {
    it('should approve news (status: accept), send notification and email to the author', async () => {
      const mockNewsId = new Types.ObjectId().toString();
      const mockAuthorId = new Types.ObjectId().toString();
      const mockAdminId = new Types.ObjectId().toString();

      const mockApprovedNews = {
        _id: new Types.ObjectId(mockNewsId),
        mainTitle: 'Luật đất đai mới',
        content: 'Nội dung chi tiết...',
        type: ETypeLawyer.CIVIL,
        userId: new Types.ObjectId(mockAuthorId),
        status: ENewsStatus.ACCEPT,
        isAccept: true,
      };

      newsRepository.findByIdAndUpdate.mockResolvedValue(mockApprovedNews);

      const result = await service.approveNews(mockNewsId, mockAdminId);

      expect(result.data?.isAccept).toBe(true);
      expect(result.data?.status).toBe(ENewsStatus.ACCEPT);
      expect(newsRepository.findByIdAndUpdate).toHaveBeenCalledWith(
        mockNewsId,
        { status: ENewsStatus.ACCEPT, isAccept: true, rejectReason: '' },
        { new: true },
      );
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient_id: mockAuthorId,
          sender_id: mockAdminId,
          type: 'NEWS_APPROVED',
          title: 'Article Approved',
        }),
      );
      expect(emailService.sendMail).toHaveBeenCalledWith(
        'lawyer@test.com',
        expect.stringContaining('Your News Article Has Been Approved'),
        expect.any(String),
      );
    });
  });

  describe('rejectNews', () => {
    it('should reject news (status: reject, isAccept: false) WITHOUT soft delete, and notify author with email', async () => {
      const mockNewsId = new Types.ObjectId().toString();
      const mockAuthorId = new Types.ObjectId().toString();
      const mockAdminId = new Types.ObjectId().toString();

      const mockNews = {
        _id: new Types.ObjectId(mockNewsId),
        mainTitle: 'Luật đất đai mới',
        content: 'Nội dung chi tiết...',
        type: ETypeLawyer.CIVIL,
        userId: new Types.ObjectId(mockAuthorId),
        status: ENewsStatus.PENDING,
        isAccept: false,
      };

      const mockRejectedNews = {
        ...mockNews,
        status: ENewsStatus.REJECT,
        rejectReason: 'Nội dung sai quy định',
      };

      newsRepository.findById.mockResolvedValue(mockNews);
      newsRepository.findByIdAndUpdate.mockResolvedValue(mockRejectedNews);

      const result = await service.rejectNews(
        mockNewsId,
        mockAdminId,
        'Nội dung sai quy định',
      );

      expect(result.data?.status).toBe(ENewsStatus.REJECT);
      expect(newsRepository.findByIdAndUpdate).toHaveBeenCalledWith(
        mockNewsId,
        expect.objectContaining({
          status: ENewsStatus.REJECT,
          isAccept: false,
          rejectReason: 'Nội dung sai quy định',
        }),
        { new: true },
      );
      // Verify isDeleted was NOT set
      expect(newsRepository.findByIdAndUpdate).not.toHaveBeenCalledWith(
        mockNewsId,
        expect.objectContaining({ isDeleted: true }),
        expect.anything(),
      );
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient_id: mockAuthorId,
          sender_id: mockAdminId,
          type: 'NEWS_REJECTED',
          title: 'Article Rejected',
          content: expect.stringContaining('Nội dung sai quy định'),
        }),
      );
      expect(emailService.sendMail).toHaveBeenCalledWith(
        'lawyer@test.com',
        expect.stringContaining('Your News Article Has Been Rejected'),
        expect.any(String),
      );
    });
  });

  describe('moderateNews', () => {
    it('should route accept action to approveNews', async () => {
      const mockNewsId = new Types.ObjectId().toString();
      const mockAuthorId = new Types.ObjectId().toString();
      const mockAdminId = new Types.ObjectId().toString();

      newsRepository.findByIdAndUpdate.mockResolvedValue({
        _id: new Types.ObjectId(mockNewsId),
        mainTitle: 'Luật đất đai mới',
        userId: new Types.ObjectId(mockAuthorId),
        status: ENewsStatus.ACCEPT,
        isAccept: true,
      });

      await service.moderateNews(
        mockNewsId,
        { action: AcceptRejectAction.ACCEPT },
        mockAdminId,
      );

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'NEWS_APPROVED',
        }),
      );
    });

    it('should route reject action to rejectNews', async () => {
      const mockNewsId = new Types.ObjectId().toString();
      const mockAuthorId = new Types.ObjectId().toString();
      const mockAdminId = new Types.ObjectId().toString();

      newsRepository.findById.mockResolvedValue({
        _id: new Types.ObjectId(mockNewsId),
        mainTitle: 'Luật đất đai mới',
        userId: new Types.ObjectId(mockAuthorId),
      });

      newsRepository.findByIdAndUpdate.mockResolvedValue({
        _id: new Types.ObjectId(mockNewsId),
        mainTitle: 'Luật đất đai mới',
        userId: new Types.ObjectId(mockAuthorId),
        status: ENewsStatus.REJECT,
      });

      await service.moderateNews(
        mockNewsId,
        {
          action: AcceptRejectAction.REJECT,
          reason: 'Thông tin không chính xác',
        },
        mockAdminId,
      );

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'NEWS_REJECTED',
          content: expect.stringContaining('Thông tin không chính xác'),
        }),
      );
    });
  });
});
