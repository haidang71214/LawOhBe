import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  age: number;

  // chỗ này sau phát triển thêm người đăng bài, với giáo viên để dạy
  @Prop({ default: 'user', enum: ['user', 'admin', 'lawyer'] })
  role: string;

  // phone
  @Prop()
  phone: number;

  // password
  @Prop()
  password: string;

  // refresh_token
  @Prop()
  refresh_token: string; // này là cho mấy cái auth

  @Prop()
  face_id: string;

  // avartar mình xài trong dto cho nó update
  @Prop()
  avartar_url: string;

  // access_token
  @Prop()
  province: string; // tỉnh thành của thằng user

  @Prop()
  access_token: string;

  // reset_token
  @Prop()
  reset_token: string;

  // cái này là mô tả/ chỉ cho luật sư có quyền mô tả
  @Prop()
  description: string;

  // năm làm việc
  @Prop()
  experienceYear: number;

  // bằng cấp
  @Prop()
  certificate: string[];

  // sao* cái này để đánh giá ông luật sư
  @Prop({ default: 0, min: 0, max: 5 })
  star: number;

  // loại luật sư // ngày mai sửa lại, cái này để mảng, cái ở dưới để bth
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'TypeLawyer',
  })
  typeLawyer: Types.ObjectId;

  // review
  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Review' })
  reviews: MongooseSchema.Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Booking' })
  bookings: Types.ObjectId;

  // gói học(user)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'LearnPackage' })
  learn_package: Types.ObjectId;
}

export const UserSchema = createSchema(User);
export const UserModelName = User.name;
export const UserDestination = {
  name: UserModelName,
  schema: UserSchema,
};
export type UserModel = Model<User>;
