import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
import { ETypeLawyer } from './enums';

// làm cái news
@Schema({ timestamps: true, collection: 'News' })
export class New extends BaseSchema {
  @Prop({ enum: ETypeLawyer })
  type: ETypeLawyer;

  @Prop()
  mainTitle: string;

  @Prop()
  content: string;

  @Prop({ default: false })
  isAccept: boolean;

  // mảng ảnh
  @Prop()
  image_url: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;
}

export const NewSchema = createSchema(New);
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
