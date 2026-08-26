import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

// tạo người nhắn, nhắn tới nhóm nào ? những ai là người đọc?
@Schema({ timestamps: true, collection: 'messages' })
export class Message extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation: Types.ObjectId;

  // ai gửi ?
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  readBy: Types.ObjectId[];
}

export const MessageSchema = createSchema(Message);
export const MessageModelName = Message.name;
export const MessageDestination = {
  name: MessageModelName,
  schema: MessageSchema,
};
export type MessageModel = Model<Message>;
