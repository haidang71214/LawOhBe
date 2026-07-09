import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

@Schema({ timestamps: true, collection: 'Comments' })
export class Comment extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Videos', required: true, index: true })
  video_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null, index: true })
  parent_comment_id: Types.ObjectId | null;
}

export const CommentSchema = createSchema(Comment);
CommentSchema.index({ video_id: 1, createdAt: -1 });

export const CommentModelName = Comment.name;
export const CommentDestination = {
  name: CommentModelName,
  schema: CommentSchema,
};
export type CommentModel = Model<Comment>;
