import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { NotificationRepository } from './repository/notification.repository';
import { Notification } from 'libs/schemas/notification';
import { Types } from 'mongoose';
import { ResponseDto } from 'libs/interfaces';
import { MessageGateway } from '../message/message.gateway';
import { RedisService, REDIS_KEYS, REDIS_TTL } from 'src/shared/redis';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    @Inject(forwardRef(() => MessageGateway))
    private readonly messageGateway: MessageGateway,
    private readonly redisService: RedisService,
  ) {}

  // Xóa toàn bộ cache liên quan tới user này
  private async clearUserCache(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.redisService.delByPattern(`cache:notifications:*:${userId}*`),
        this.redisService.del(REDIS_KEYS.NOTIFICATION_UNREAD(userId)),
      ]);
    } catch (error: any) {
      this.logger.error(
        `Error clearing notification cache for user ${userId}:`,
        error,
      );
    }
  }

  // Lấy danh sách thông báo của user có phân trang và lọc theo trạng thái đã đọc
  async getAllByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
    isRead?: boolean,
  ): Promise<
    ResponseDto<{
      data: Notification[];
      total: number;
      unreadCount: number;
    }>
  > {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const cacheKey = REDIS_KEYS.NOTIFICATIONS_BY_USER(
      userId,
      `${pageNum}:${limitNum}:${isRead !== undefined ? isRead : 'all'}`,
    );

    // Kiểm tra Redis cache
    const cached = await this.redisService.get<{
      data: Notification[];
      total: number;
      unreadCount: number;
    }>(cacheKey);

    if (cached) {
      return ResponseDto.success(cached);
    }

    const filter: any = {
      recipient_id: new Types.ObjectId(userId),
    };

    if (typeof isRead === 'boolean') {
      filter.is_read = isRead;
    }

    const [response, unreadCount] = await Promise.all([
      this.notificationRepository.findWithPagination(
        filter,
        pageNum,
        limitNum,
        { createdAt: -1 },
        [{ path: 'sender_id', select: 'name email phone avartar_url role' }],
      ),
      this.notificationRepository.countDocuments({
        recipient_id: new Types.ObjectId(userId),
        is_read: false,
      }),
    ]);

    const resultData = {
      ...response,
      unreadCount,
    };

    // Lưu vào Redis cache trong 1 phút
    await this.redisService.set(cacheKey, resultData, REDIS_TTL.ONE_MINUTE);

    return ResponseDto.success(resultData);
  }

  // Đếm số lượng thông báo chưa đọc của user
  async getUnreadCount(
    userId: string,
  ): Promise<ResponseDto<{ unreadCount: number }>> {
    const cacheKey = REDIS_KEYS.NOTIFICATION_UNREAD(userId);

    // Kiểm tra cache Redis
    const cached = await this.redisService.get<{ unreadCount: number }>(
      cacheKey,
    );
    if (cached) {
      return ResponseDto.success(cached);
    }

    const unreadCount = await this.notificationRepository.countDocuments({
      recipient_id: new Types.ObjectId(userId),
      is_read: false,
    });

    const result = { unreadCount };

    // Lưu vào Redis cache
    await this.redisService.set(cacheKey, result, REDIS_TTL.ONE_MINUTE);

    return ResponseDto.success(result);
  }

  // Đánh dấu 1 thông báo đã đọc
  async markAsRead(
    notificationId: string,
    userId?: string,
  ): Promise<ResponseDto<Notification | null>> {
    const filter: any = {
      _id: new Types.ObjectId(notificationId),
    };
    if (userId) {
      filter.recipient_id = new Types.ObjectId(userId);
    }

    const result = await this.notificationRepository.findOneAndUpdate(
      filter,
      { $set: { is_read: true } },
      { new: true },
    );

    // Xóa cache khi cập nhật trạng thái đọc
    if (userId) {
      await this.clearUserCache(userId);
    } else if (result?.recipient_id) {
      await this.clearUserCache(result.recipient_id.toString());
    }

    return ResponseDto.success(result);
  }

  // Đánh dấu tất cả thông báo của user là đã đọc
  async markAllAsRead(
    userId: string,
  ): Promise<ResponseDto<{ modifiedCount: number }>> {
    const result = await this.notificationRepository.updateMany(
      {
        recipient_id: new Types.ObjectId(userId),
        is_read: false,
      },
      {
        $set: { is_read: true },
      },
    );

    // Xóa cache của user
    await this.clearUserCache(userId);

    return ResponseDto.success({
      modifiedCount: result.modifiedCount || 0,
    });
  }

  // Tạo notification, đồng thời gửi socket tới fe
  async createNotification(payload: {
    recipient_id: string;
    sender_id?: string;
    title: string;
    content: string;
    type?: string;
    metadata?: Record<string, any>;
  }): Promise<ResponseDto<Notification | null>> {
    const newNotification = await this.notificationRepository.create({
      ...payload,
      recipient_id: new Types.ObjectId(payload.recipient_id),
      sender_id: payload.sender_id
        ? new Types.ObjectId(payload.sender_id)
        : undefined,
      is_read: false,
    });

    // Xóa cache của user nhận thông báo
    await this.clearUserCache(payload.recipient_id);

    // Populate sender_id để socket gửi đầy đủ thông tin
    let populatedNotif: any = newNotification;
    if (newNotification?._id) {
      populatedNotif = await this.notificationRepository.findById(
        newNotification._id,
        [{ path: 'sender_id', select: 'name email phone avartar_url role' }],
      );
    }

    // Bắn socket mới tới room của user
    try {
      if (this.messageGateway?.server) {
        this.messageGateway.server
          .to(payload.recipient_id)
          .emit('newNotification', populatedNotif || newNotification);
      }
    } catch (error: any) {
      this.logger.error('Error emitting notification socket:', error);
    }

    return ResponseDto.success(populatedNotif || newNotification);
  }

  // Xóa 1 thông báo của user
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<ResponseDto<Notification | null>> {
    const result = await this.notificationRepository.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      recipient_id: new Types.ObjectId(userId),
    });

    if (!result) {
      throw new NotFoundException(
        'Thông báo không tồn tại hoặc bạn không có quyền xóa',
      );
    }

    // Xóa cache của user
    await this.clearUserCache(userId);

    return ResponseDto.success(result, 'Xóa thông báo thành công');
  }

  // Xóa tất cả thông báo của user
  async deleteAllNotifications(
    userId: string,
  ): Promise<ResponseDto<{ deletedCount: number }>> {
    const result = await this.notificationRepository.deleteMany({
      recipient_id: new Types.ObjectId(userId),
    });

    // Xóa cache của user
    await this.clearUserCache(userId);

    return ResponseDto.success(
      { deletedCount: result.deletedCount || 0 },
      'Đã xóa tất cả thông báo thành công',
    );
  }
}
