import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

// Chat conversation schema (1-to-1 or group chat)
@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation extends BaseSchema {
  @Prop({ type: [Types.ObjectId], ref: 'User', required: true, index: true })
  participants: Types.ObjectId[];
}

export const ConversationSchema = createSchema(Conversation);

export const ConversationModelName = Conversation.name;
export const ConversationDestination = {
  name: ConversationModelName,
  schema: ConversationSchema,
};
export type ConversationModel = Model<Conversation>;
