import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

// tạo phòng nhắn tin, có thể là 1 1 hoặc nhiều 1
@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation extends BaseSchema {
  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  participants: Types.ObjectId[];
}

export const ConversationSchema = createSchema(Conversation);
export const ConversationModelName = Conversation.name;
export const ConversationDestination = {
  name: ConversationModelName,
  schema: ConversationSchema,
};
export type ConversationModel = Model<Conversation>;
