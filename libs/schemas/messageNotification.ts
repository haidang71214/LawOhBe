import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

@Schema({ timestamps: true, collection: 'message_notifications' })
export class MessageNotification extends BaseSchema {
  // Người nhận thông báo tin nhắn
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipient_id: Types.ObjectId;

  // Người gửi tin nhắn
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  sender_id: Types.ObjectId;

  // Cuộc trò chuyện liên quan
  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversation_id: Types.ObjectId;

  // Tin nhắn mới nhất
  @Prop({ type: Types.ObjectId, ref: 'Message', required: false })
  last_message_id?: Types.ObjectId;

  // Trích đoạn nội dung tin nhắn mới nhất
  @Prop({ required: true })
  content: string;

  // Trạng thái đã đọc hay chưa
  @Prop({ default: false, index: true })
  is_read: boolean;

  // Số lượng tin nhắn chưa đọc trong cuộc hội thoại này
  @Prop({ default: 1, min: 0 })
  unread_count: number;
}

export const MessageNotificationSchema = createSchema(MessageNotification);
MessageNotificationSchema.index({ recipient_id: 1, conversation_id: 1 });
MessageNotificationSchema.index({ recipient_id: 1, is_read: 1 });

export const MessageNotificationModelName = MessageNotification.name;
export const MessageNotificationDestination = {
  name: MessageNotificationModelName,
  schema: MessageNotificationSchema,
};
export type MessageNotificationModel = Model<MessageNotification>;
