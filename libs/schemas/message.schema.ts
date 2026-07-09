import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

@Schema({ timestamps: true, collection: 'messages' })
export class Message extends BaseSchema {
  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversation: Types.ObjectId;

  // Sender user reference
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  sender: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  readBy: Types.ObjectId[];
}

export const MessageSchema = createSchema(Message);
MessageSchema.index({ conversation: 1, createdAt: 1 });

export const MessageModelName = Message.name;
export const MessageDestination = {
  name: MessageModelName,
  schema: MessageSchema,
};
export type MessageModel = Model<Message>;
