import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

// admin sẽ sử dụng cái này để đki
@Schema({ timestamps: true, collection: 'payments' })
export class Payment extends BaseSchema {
  @Prop({ required: true })
  transaction_no: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['VNPAY', 'Bank', 'Cash'], default: 'VNPAY' }) // method ở đây là vnpay hết
  payment_method: string;

  @Prop({
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending',
  })
  status: string;

  @Prop()
  response_code: string;

  @Prop()
  payment_date: Date;

  @Prop()
  vnp_PayDate: Date;

  @Prop()
  vnp_TransactionStatus: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  client_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  lawyer_id: Types.ObjectId;

  // thêm cái booking vào đây
  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  booking_id: Types.ObjectId;
}

export const PaymentSchema = createSchema(Payment);
export const PaymentModelName = Payment.name;
export const PaymentDestination = {
  name: PaymentModelName,
  schema: PaymentSchema,
};
export type PaymentModel = Model<Payment>;
