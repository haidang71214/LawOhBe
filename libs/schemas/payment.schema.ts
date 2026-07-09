import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

@Schema({ timestamps: true, collection: 'payments' })
export class Payment extends BaseSchema {
  @Prop({ required: true, unique: true, index: true })
  transaction_no: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['VNPAY', 'Bank', 'Cash'], default: 'VNPAY' })
  payment_method: string;

  @Prop({
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop()
  response_code: string;

  @Prop({ index: true })
  payment_date: Date;

  @Prop()
  vnp_PayDate: Date;

  @Prop()
  vnp_TransactionStatus: string;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  client_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  lawyer_id: Types.ObjectId;

  // Booking reference
  @Prop({ type: Types.ObjectId, ref: 'Booking', index: true })
  booking_id: Types.ObjectId;
}

export const PaymentSchema = createSchema(Payment);
PaymentSchema.index({ client_id: 1, lawyer_id: 1, booking_id: 1 });
PaymentSchema.index({ status: 1, payment_date: -1 });

export const PaymentModelName = Payment.name;
export const PaymentDestination = {
  name: PaymentModelName,
  schema: PaymentSchema,
};
export type PaymentModel = Model<Payment>;
