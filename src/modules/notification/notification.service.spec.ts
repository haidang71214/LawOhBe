import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './repository/notification.repository';
import { MessageGateway } from '../message/message.gateway';
import { RedisService } from 'src/shared/redis';
import { Types } from 'mongoose';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: jest.Mocked<any>;
  let messageGateway: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;

  beforeEach(async () => {
    notificationRepository = {
      find: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      findWithPagination: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      countDocuments: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
    };

    messageGateway = {
      server: {
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
      },
    };

    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      delByPattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useValue: notificationRepository,
        },
        {
          provide: MessageGateway,
          useValue: messageGateway,
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllByUserId', () => {
    it('should call findWithPagination with correct parameters', async () => {
      const userId = new Types.ObjectId().toString();
      const mockResult = { data: [{ title: 'Test' }], total: 1 };
      notificationRepository.findWithPagination.mockResolvedValue(mockResult);
      notificationRepository.countDocuments.mockResolvedValue(1);

      const res = await service.getAllByUserId(userId, 1, 10, false);

      expect(notificationRepository.findWithPagination).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient_id: new Types.ObjectId(userId),
          is_read: false,
        }),
        1,
        10,
        { createdAt: -1 },
        [{ path: 'sender_id', select: 'name email phone avartar_url role' }],
      );
      expect(notificationRepository.countDocuments).toHaveBeenCalledWith({
        recipient_id: new Types.ObjectId(userId),
        is_read: false,
      });
      expect(res.data).toEqual({ ...mockResult, unreadCount: 1 });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      const userId = new Types.ObjectId().toString();
      notificationRepository.countDocuments.mockResolvedValue(5);

      const res = await service.getUnreadCount(userId);

      expect(notificationRepository.countDocuments).toHaveBeenCalledWith({
        recipient_id: new Types.ObjectId(userId),
        is_read: false,
      });
      expect(res.data).toEqual({ unreadCount: 5 });
    });
  });

  describe('markAsRead', () => {
    it('should update is_read to true for specific notification', async () => {
      const notifId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      const mockUpdated = { _id: notifId, is_read: true };
      notificationRepository.findOneAndUpdate.mockResolvedValue(mockUpdated);

      const res = await service.markAsRead(notifId, userId);

      expect(notificationRepository.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: new Types.ObjectId(notifId),
          recipient_id: new Types.ObjectId(userId),
        },
        { $set: { is_read: true } },
        { new: true },
      );
      expect(res.data).toEqual(mockUpdated);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const userId = new Types.ObjectId().toString();
      notificationRepository.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const res = await service.markAllAsRead(userId);

      expect(notificationRepository.updateMany).toHaveBeenCalledWith(
        {
          recipient_id: new Types.ObjectId(userId),
          is_read: false,
        },
        {
          $set: { is_read: true },
        },
      );
      expect(res.data).toEqual({ modifiedCount: 3 });
    });
  });

  describe('createNotification', () => {
    it('should create notification and emit socket event', async () => {
      const recipientId = new Types.ObjectId().toString();
      const mockCreated = {
        _id: new Types.ObjectId().toString(),
        title: 'New Event',
        content: 'Content here',
        recipient_id: new Types.ObjectId(recipientId),
        is_read: false,
      };
      notificationRepository.create.mockResolvedValue(mockCreated);
      notificationRepository.findById.mockResolvedValue(mockCreated);

      const res = await service.createNotification({
        recipient_id: recipientId,
        title: 'New Event',
        content: 'Content here',
      });

      expect(notificationRepository.create).toHaveBeenCalled();
      expect(messageGateway.server.to).toHaveBeenCalledWith(recipientId);
      expect(res.data).toEqual(mockCreated);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification by id and userId', async () => {
      const notifId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      const mockDeleted = { _id: notifId, recipient_id: userId };
      notificationRepository.findOneAndDelete = jest
        .fn()
        .mockResolvedValue(mockDeleted);

      const res = await service.deleteNotification(notifId, userId);

      expect(notificationRepository.findOneAndDelete).toHaveBeenCalledWith({
        _id: new Types.ObjectId(notifId),
        recipient_id: new Types.ObjectId(userId),
      });
      expect(res.data).toEqual(mockDeleted);
    });

    it('should throw NotFoundException if notification not found', async () => {
      const notifId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      notificationRepository.findOneAndDelete = jest
        .fn()
        .mockResolvedValue(null);

      await expect(
        service.deleteNotification(notifId, userId),
      ).rejects.toThrow();
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all notifications for a user', async () => {
      const userId = new Types.ObjectId().toString();
      notificationRepository.deleteMany = jest
        .fn()
        .mockResolvedValue({ deletedCount: 5 });

      const res = await service.deleteAllNotifications(userId);

      expect(notificationRepository.deleteMany).toHaveBeenCalledWith({
        recipient_id: new Types.ObjectId(userId),
      });
      expect(res.data).toEqual({ deletedCount: 5 });
    });
  });
});
