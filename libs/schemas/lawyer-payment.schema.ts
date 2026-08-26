import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

@Schema({ timestamps: true, collection: 'lawyer_payments' })
export class LawyerPayment extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Payment', required: true })
  payment_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  lawyer_id: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  commission: number;

  @Prop({ enum: ['pending', 'success', 'failed'], default: 'pending' })
  status: string;

  @Prop({ required: true, unique: true, type: String })
  transaction_no: string;

  @Prop()
  payment_date: Date;

  @Prop()
  payment_method: string;
}

export const LawyerPaymentSchema = createSchema(LawyerPayment);
export const LawyerPaymentModelName = LawyerPayment.name;
export const LawyerPaymentDestination = {
  name: LawyerPaymentModelName,
  schema: LawyerPaymentSchema,
};
export type LawyerPaymentModel = Model<LawyerPayment>;
