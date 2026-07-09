import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
import { ETypeLawyer } from './enums';

@Schema({ timestamps: true, collection: 'bookings' })
export class Booking extends BaseSchema {
  // Client who creates the booking
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  client_id: Types.ObjectId;

  // Lawyer booked
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  lawyer_id: Types.ObjectId;

  @Prop({ index: true })
  booking_start: Date;

  @Prop({ index: true })
  booking_end: Date;

  @Prop({
    default: 'pending',
    enum: ['none', 'pending', 'accept', 'paid', 'reject', 'done', 'cancelled'],
    index: true,
  })
  status: string;

  @Prop()
  income: number;

  @Prop()
  amount: number;

  @Prop({ enum: ETypeLawyer })
  typeBooking: ETypeLawyer;

  @Prop()
  note: string;
}

export const BookingSchema = createSchema(Booking);
BookingSchema.index({ client_id: 1, lawyer_id: 1 });
BookingSchema.index({ lawyer_id: 1, typeBooking: 1 });
BookingSchema.index({ status: 1, booking_end: 1 });

export const BookingModelName = Booking.name;
export const BookingDestination = {
  name: BookingModelName,
  schema: BookingSchema,
};
export type BookingModel = Model<Booking>;
