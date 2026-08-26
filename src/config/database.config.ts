// cấu hình kết nối database
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose'; // lấy từ mongoose

export const databaseConfig: MongooseModuleOptions = {
   uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/LawOhBeLocal',
 };
   
export enum ETypeLawyer {
  INSURANCE = 'INSURANCE',
  CIVIL = 'CIVIL',
  LAND = 'LAND',
  CORPORATE = 'CORPORATE',
  TRANSPORTATION = 'TRANSPORTATION',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  CRIMINAL = 'CRIMINAL',
  FAMILY = 'FAMILY',
  LABOR = 'LABOR',
  INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY',
  INHERITANCE = 'INHERITANCE',
  TAX = 'TAX',
}

@Schema({ timestamps: true,
   collection: 'users',
})
export class User extends Document {
  @Prop({ required: true })
  name: string;
  @Prop({ required: true, unique: true })
  email: string;
  @Prop()
  age: number;
// chỗ này sau phát triển thêm người đăng bài, với giáo viên để dạy
  @Prop({ default: 'user',enum: ['user','admin','lawyer'] })
  role: string;
// phone
  @Prop()
  phone: number;
// password
  @Prop()
  password: string;
// refresh_token
  @Prop()
  refresh_token:string; // này là cho mấy cái auth 
  @Prop()
  face_id:string;
// avartar mình xài trong dto cho nó update
  @Prop()
  avartar_url:string
// access_token
  @Prop()
  province:string // tỉnh thành của thằng user
  @Prop()
  warn:string // quận huyện 
  @Prop()
  access_token:string;
// reset_token
  @Prop()
  reset_token:string;
// cái này là mô tả/ chỉ cho luật sư có quyền mô tả
  @Prop()
  description:string
  //sao* cái này để đánh giá ông luật sư
  @Prop({default:0,limit:5})
  start:number;
  // loại luật sư // ngày mai sửa lại, cái này để mảng, cái ở dưới để bth 
@Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'TypeLawyer',
  })
  typeLawyer: Types.ObjectId;
  // review
  @Prop({ type:MongooseSchema.Types.ObjectId, ref:'Review' })
  // booking
  reviews:Types.ObjectId;
  @Prop({ type:MongooseSchema.Types.ObjectId,ref:'Booking' })
  bookings:Types.ObjectId;
  
  // gói thuê (user)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'VipPackage' }) // lấy từ schema VipPackage
  vip_package: Types.ObjectId;
  // gói học(user)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'LearnPackage' })
  learn_package: Types.ObjectId;
}


// gói này mình thay đổi thành
// vip 1, mở các form mẫu đơn free, trong 1 tháng
// vip 2, giảm giá booking, trong 3 tháng, có đặc quyền của vip 1
// vip 3, đang nghĩ =)))
@Schema({ timestamps: true, collection: 'vip_packages' })
export class VipPackage extends Document {
  @Prop({ required: true, default: 'none', enum: ['none','standard','gold','deluxe'] })
  type: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ required: true })
  desctiption: string; // mô tả quyền lợi

  @Prop()
  vip_expired: Date; // 1 cái vip thì sẽ có 1 khoảng thời gian
//
  @Prop({ type: [String] })
  benefits: string[]; // chức năng được buff với gói vip
}

// bảng phụ, bảng trên cho phép luật sư tạo gói vip, bảng dưới cho phép nhiều client dùng gói hay gì đó 
@Schema({ timestamps: true, collection: 'vip_clients' })
export class VipClient extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  client_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'VipPackage', required: true })
  vip_package_id: Types.ObjectId;

  @Prop({ required: true })
  vip_start: Date;

  @Prop({ required: true })
  vip_expired: Date;

  @Prop({ default: true })
  is_active: boolean;
}



// learn package
@Schema({ timestamps: true,
   collection: 'learn_packages',
 }) 
export class LearnPackage extends Document {
  // tên gói
  @Prop({ required: true })
  name: string;
  // giá
  @Prop({ required: true })
  price: number;
  // loại gói, sửa thành ngày tháng năm
  @Prop({default:'none',enum:['none','standard','gold','deluxe']})
  type: string;
  // ngày bắt đầu
  @Prop()
  learn_start: Date;
  // ngày hết hạn
  @Prop()
  learn_end: Date;
}
// loại luật sư
@Schema({ 
  timestamps: true,
  collection: 'type_lawyers'
})
// cái này tự tạo sau đó thì nhét hết vô 1 thằng lawyer những cái type này
export class TypeLawyer extends Document {
  @Prop({ 
    type:[String],
    required: true,
    enum: ETypeLawyer
  })
  type: ETypeLawyer[];
}
// loại luật sư con cháu, loại này mình khống chế ở fe
@Schema({ 
  timestamps: true,
  collection: 'sub_type_lawyers'
})
export class SubTypeLawyer extends Document {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'TypeLawyer',
    required: true 
  })
  // 
  parentType: Types.ObjectId;
  @Prop({ required: false, type: [String] })
  subType: string;
}

// tạo 1 bảng booking, người dùng có thể thuê theo ngày, theo tháng hay theo năm với chính thằng luật sư đó, mình sẽ là người ăn hoa hồng
@Schema({ timestamps: true, collection: 'bookings' })
export class Booking extends Document {
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
  booking_end:Date;
  // hàm tự reset sẽ check chỗ booking_end 
  // trong trường hợp done-> thay bằng accept hoặc reject 
  @Prop({default:false})
  status: boolean;
  // thêm chỗ thu nhập nếu accept
  @Prop()
  income:number;
  @Prop()
  note: string; // khi user gửi request booking thì 
  // thằng lawyer sẽ dựa trên cái này để accept hoặc reject
  // lịch cá nhân thì tự sắp xếp
}

// review thì làm như nào để người dùng, dùng xong số ngày đó rồi đánh giá
@Schema({ timestamps: true, collection: 'reviews' })
export class Review extends Document {
  // Người dùng đánh giá
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  client_id: Types.ObjectId; // đổi từ user_id qua client_id
  // Luật sư bị đánh giá
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  lawyer_id: Types.ObjectId;
  // Số sao đánh giá (1-5)
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;
  @Prop()
  comment: string;
  @Prop()
  review_date: Date;
  // khi hết hết thuê thì hắn tự nhả ra true -> đồng thời client đánh giá lawyer
  @Prop({ default:false })
  status:boolean
}
// này là admin tạo để khống chế giá
@Schema({ timestamps: true, collection: 'MarketPriceRanges' })
export class MarketPriceRange extends Document{
  @Prop({ required:true, enum:ETypeLawyer })
  type:ETypeLawyer;
  @Prop({ required:true,min:0})
  minPrice:number;
  @Prop({ required:true,min:0 })
  maxPrice:number;
  @Prop({required:false})
  description:string; // mô tả, nếu cần
}
// này là luật sư tạo
@Schema({ timestamps: true, collection: 'customPrices' })
export class CustomPrice extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  lawyer_id: Types.ObjectId;
  @Prop({enum:ETypeLawyer})
  type:ETypeLawyer;
  @Prop()
  price:number;
  @Prop()
  description:string
}

export const CustomPriceSchema = SchemaFactory.createForClass(CustomPrice);
// tạo schema
export const MarketPriceRangeSchema = SchemaFactory.createForClass(MarketPriceRange);
export const UserSchema = SchemaFactory.createForClass(User);
export const VipPackageSchema = SchemaFactory.createForClass(VipPackage);
export const LearnPackageSchema = SchemaFactory.createForClass(LearnPackage);
export const TypeLawyerSchema = SchemaFactory.createForClass(TypeLawyer);
export const SubTypeLawyerSchema = SchemaFactory.createForClass(SubTypeLawyer); 
export const BookingSchema = SchemaFactory.createForClass(Booking);
export const ReviewSchema = SchemaFactory.createForClass(Review);
export const VipClientSchema = SchemaFactory.createForClass(VipClient)