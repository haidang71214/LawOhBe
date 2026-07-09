import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
import { ETypeLawyer } from './enums';

export enum ENewsStatus {
  PENDING = 'pending',
  ACCEPT = 'accept',
  REJECT = 'reject',
}

@Schema({ timestamps: true, collection: 'News' })
export class New extends BaseSchema {
  @Prop({ enum: ETypeLawyer, index: true })
  type: ETypeLawyer;

  @Prop()
  mainTitle: string;

  @Prop()
  content: string;

  @Prop({
    enum: ['pending', 'accept', 'reject'],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop({ default: false, index: true })
  isAccept: boolean;

  @Prop()
  rejectReason?: string;

  // Image URLs array
  @Prop()
  image_url: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;
}

export const NewSchema = createSchema(New);
NewSchema.index({ status: 1, type: 1 });
NewSchema.index({ isAccept: 1, type: 1 });
NewSchema.index({ userId: 1, createdAt: -1 });

export const NewsSchema = NewSchema;
export const NewModelName = New.name;
export const NewsModelName = New.name;
export const NewDestination = {
  name: NewModelName,
  schema: NewSchema,
};
export const NewsDestination = NewDestination;
export type NewModel = Model<New>;
export type NewsModel = Model<New>;
