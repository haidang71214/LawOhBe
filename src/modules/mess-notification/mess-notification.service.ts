import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { MessNotificationRepository } from './repository/mess-notification.repository';
import { MessageNotification } from 'libs/schemas/messageNotification';
import { Types } from 'mongoose';
import { ResponseDto } from 'libs/interfaces';
import { MessageGateway } from '../message/message.gateway';

@Injectable()
export class MessNotificationService {
  private readonly logger = new Logger(MessNotificationService.name);

  constructor(
    private readonly messNotificationRepository: MessNotificationRepository,
    @Inject(forwardRef(() => MessageGateway))
    private readonly messageGateway: MessageGateway,
  ) {}

  // Lấy danh sách thông báo tin nhắn của user
  async getAllByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<
    ResponseDto<{ data: MessageNotification[] | null; total: number }>
  > {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);

    const response = await this.messNotificationRepository.findWithPagination(
      {
        recipient_id: new Types.ObjectId(userId),
      },
      pageNum,
      limitNum,
      { updatedAt: -1 },
      [
        { path: 'sender_id', select: 'name email phone avartar_url role' },
        { path: 'conversation_id' },
      ],
    );

    return ResponseDto.success(response);
  }

  // Đếm tổng số tin nhắn chưa đọc của user và lấy danh sách các cuộc hội thoại chưa đọc
  async getUnreadCount(userId: string): Promise<
    ResponseDto<{
      totalUnread: number;
      unreadConversationsCount: number;
      unreadList: MessageNotification[];
      latestUnread: MessageNotification | null;
    }>
  > {
    const notifications = await this.messNotificationRepository.find(
      {
        recipient_id: new Types.ObjectId(userId),
        is_read: false,
      },
      [
        { path: 'sender_id', select: 'name email phone avartar_url role' },
        { path: 'conversation_id' },
      ],
      { updatedAt: -1 },
    );

    const totalUnread = notifications.reduce(
      (acc, curr) => acc + (curr.unread_count || 1),
      0,
    );

    const unreadConversationsCount = notifications.length;
    const latestUnread = notifications.length > 0 ? notifications[0] : null;

    return ResponseDto.success({
      totalUnread,
      unreadConversationsCount,
      unreadList: notifications,
      latestUnread,
    });
  }

  // Đánh dấu đã đọc khi user mở box chat của 1 cuộc hội thoại
  async markAsReadByConversation(
    conversationId: string,
    userId: string,
  ): Promise<ResponseDto<MessageNotification | null>> {
    const result = await this.messNotificationRepository.findOneAndUpdate(
      {
        conversation_id: new Types.ObjectId(conversationId),
        recipient_id: new Types.ObjectId(userId),
      },
      {
        $set: {
          is_read: true,
          unread_count: 0,
        },
      },
      { new: true },
    );

    return ResponseDto.success(result);
  }

  // Tạo hoặc Cập nhật thông báo tin nhắn (Upsert theo conversation + recipient)
  async createOrUpdateMessageNotification(payload: {
    recipient_id: string;
    sender_id: string;
    conversation_id: string;
    last_message_id?: string;
    content: string;
  }): Promise<ResponseDto<MessageNotification | null>> {
    const filter = {
      recipient_id: new Types.ObjectId(payload.recipient_id),
      conversation_id: new Types.ObjectId(payload.conversation_id),
    };

    const update = {
      $set: {
        recipient_id: new Types.ObjectId(payload.recipient_id),
        sender_id: new Types.ObjectId(payload.sender_id),
        conversation_id: new Types.ObjectId(payload.conversation_id),
        last_message_id: payload.last_message_id
          ? new Types.ObjectId(payload.last_message_id)
          : undefined,
        content: payload.content,
        is_read: false,
      },
      $inc: {
        unread_count: 1,
      },
    };

    const updatedNotif = await this.messNotificationRepository.findOneAndUpdate(
      filter,
      update,
      { upsert: true, new: true },
    );

    // Populate sender_id và conversation_id để realtime socket và response có đầy đủ thông tin
    let populatedNotif: any = updatedNotif;
    if (updatedNotif?._id) {
      populatedNotif = await this.messNotificationRepository.findById(
        updatedNotif._id,
        [
          { path: 'sender_id', select: 'name email phone avartar_url role' },
          { path: 'conversation_id' },
        ],
      );
    }

    // Bắn socket realtime tới room cá nhân của người nhận
    try {
      if (this.messageGateway?.server) {
        this.messageGateway.server
          .to(payload.recipient_id)
          .emit('newMessageNotification', populatedNotif || updatedNotif);
      }
    } catch (error: any) {
      this.logger.error('Error emitting chat notification socket:', error);
    }

    return ResponseDto.success(populatedNotif || updatedNotif);
  }
}
