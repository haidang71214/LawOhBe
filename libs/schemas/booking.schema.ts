import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
import { ETypeLawyer } from './enums';

// tạo 1 bảng booking, người dùng có thể thuê theo ngày, theo tháng hay theo năm với chính thằng luật sư đó, mình sẽ là người ăn hoa hồng
@Schema({ timestamps: true, collection: 'bookings' })
export class Booking extends BaseSchema {
  // Người dùng thuê luật sư
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  client_id: Types.ObjectId;

  // Luật sư được thuê
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  lawyer_id: Types.ObjectId;

  // khi tới quá hạn ngày kết thúc 1 ngày thì tự nhả ra review (chắc làm theo dạng modal)
  @Prop()
  booking_start: Date;

  @Prop()
  booking_end: Date;

  // hàm tự reset sẽ check chỗ booking_end
  // trong trường hợp done-> thay bằng accept hoặc reject
  @Prop({ default: 'none', enum: ['none', 'accept', 'reject', 'done'] })
  status: string;

  // thêm chỗ thu nhập nếu accept
  @Prop()
  income: number;

  @Prop({ enum: ETypeLawyer })
  typeBooking: ETypeLawyer;

  @Prop()
  note: string; // khi user gửi request booking thì
  // thằng lawyer sẽ dựa trên cái này để accept hoặc reject
  // lịch cá nhân thì tự sắp xếp
}

export const BookingSchema = createSchema(Booking);
export const BookingModelName = Booking.name;
export const BookingDestination = {
  name: BookingModelName,
  schema: BookingSchema,
};
export type BookingModel = Model<Booking>;
