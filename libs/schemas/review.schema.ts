import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

@Schema({ timestamps: true, collection: 'reviews' })
export class Review extends BaseSchema {
  // Reviewer client reference
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  client_id: Types.ObjectId;

  // Reviewed lawyer reference
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  lawyer_id: Types.ObjectId;

  // Rating stars (1-5)
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment: string;

  @Prop({ index: true })
  review_date: Date;
}

export const ReviewSchema = createSchema(Review);
ReviewSchema.index({ lawyer_id: 1, client_id: 1 });
ReviewSchema.index({ lawyer_id: 1, rating: -1 });

export const ReviewModelName = Review.name;
export const ReviewDestination = {
  name: ReviewModelName,
  schema: ReviewSchema,
};
export type ReviewModel = Model<Review>;
