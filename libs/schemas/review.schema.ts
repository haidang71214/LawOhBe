import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

// review thì làm như nào để người dùng, dùng xong số ngày đó rồi đánh giá
@Schema({ timestamps: true, collection: 'reviews' })
export class Review extends BaseSchema {
  // Người dùng đánh giá
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  client_id: Types.ObjectId; // đổi từ user_id qua client_id

  // Luật sư bị đánh giá
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  // lấy theo cái này
  lawyer_id: Types.ObjectId;

  // Số sao đánh giá (1-5)
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment: string;

  @Prop()
  review_date: Date;
}

export const ReviewSchema = createSchema(Review);
export const ReviewModelName = Review.name;
export const ReviewDestination = {
  name: ReviewModelName,
  schema: ReviewSchema,
};
export type ReviewModel = Model<Review>;
