import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
// mình nghĩ là mình sẽ thiết kế mở notification -> add chay vào socket.
@Schema({ timestamps: true, collection: 'notifications' })
export class Notification extends BaseSchema {
  // người nhận
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipient_id: Types.ObjectId;
  // người đọc
  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender_id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    enum: [
      'BOOKING',
      'PAYMENT',
      'CHAT',
      'MESSAGE',
      'SYSTEM',
      'LAWYER_APPROVAL',
      'LAWYER_APPROVED',
      'LAWYER_REJECTED',
      'NEWS_PENDING',
      'NEWS_APPROVED',
      'NEWS_REJECTED',
    ],
    default: 'SYSTEM',
  })
  type: string;

  @Prop({ type: Object, default: {} })
  metadata: {
    // id booking, id bài viết, id cuộc trò chuyện....
    reference_id?: string;
    // đường dẫn cụ thể
    target_url?: string;
    link?: string;
    [key: string]: any;
  };

  @Prop({ default: false, index: true })
  is_read: boolean;
}

export const NotificationSchema = createSchema(Notification);
NotificationSchema.index({ recipient_id: 1, is_read: 1 });

export const NotificationModelName = Notification.name;
export const NotificationDestination = {
  name: NotificationModelName,
  schema: NotificationSchema,
};
export type NotificationModel = Model<Notification>;
