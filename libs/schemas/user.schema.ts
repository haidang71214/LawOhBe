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

  @Prop({ default: 'user', enum: ['user', 'admin', 'lawyer'] })
  role: string;

  @Prop()
  phone: number;

  @Prop()
  password: string;

  @Prop()
  refresh_token: string;

  @Prop()
  face_id: string;

  @Prop()
  avartar_url: string;

  @Prop()
  province: string;

  @Prop()
  access_token: string;

  @Prop()
  reset_token: string;

  // Email verification status and token
  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  verify_email_token: string;

  // Lawyer specific fields
  @Prop()
  description: string;

  @Prop()
  experienceYear: number;

  @Prop()
  certificate: string[];

  // Rating star (0-5)
  @Prop({ default: 0, min: 0, max: 5 })
  star: number;

  // Lawyer category reference
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'TypeLawyer',
  })
  typeLawyer: Types.ObjectId;

  // Reviews
  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Review' })
  reviews: MongooseSchema.Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Booking' })
  bookings: Types.ObjectId;

  // Learning package reference
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'LearnPackage' })
  learn_package: Types.ObjectId;

  // Lawyer role application fields
  @Prop({
    default: 'none',
    enum: ['none', 'pending', 'accepted', 'rejected'],
    index: true,
  })
  lawyer_request_status: string;

  @Prop()
  lawyer_request_reason: string;

  @Prop({ type: [String] })
  pending_type_lawyer: string[];

  @Prop({ type: [String] })
  pending_sub_type_lawyers: string[];
}

export const UserSchema = createSchema(User);
export const UserModelName = User.name;
export const UserDestination = {
  name: UserModelName,
  schema: UserSchema,
};
export type UserModel = Model<User>;
