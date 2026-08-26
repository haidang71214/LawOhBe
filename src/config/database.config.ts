// cấu hình kết nối database
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose'; // lấy từ mongoose

export const databaseConfig: MongooseModuleOptions = {
   uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/LawOhBeLocal',
 };
   

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
  @Prop({ default: 'user',enum: ['user','admin','laywer'] })
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
  // loại luật sư
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TypeLawyer' })
  type_lawyer: Types.ObjectId;
  // review
  @Prop({ type:MongooseSchema.Types.ObjectId, ref:'Review' })
  // booking
  reviews:Types.ObjectId;
  @Prop({ type:MongooseSchema.Types.ObjectId,ref:'Booking' })
  bookings:Types.ObjectId;
  
  // gói thuê (user)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'VipPackage' }) // lấy từ schema VipPackage
  vip_package: Types.ObjectId;
  // gói học  (user)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'LearnPackage' })
learn_package: Types.ObjectId;

}




// vip package
@Schema({ timestamps: true,
   collection: 'vip_packages',
 })
export class VipPackage extends Document {
   // tên gói
  @Prop({ required: true })
  name: string;
  // loại gói
  @Prop({ required: true,default:'none', enum: ['none','standard', 'gold', 'deluxe'] })
  type: string;
  // giá
  @Prop({ required: true,default:0 })
  price: number;
  // ngày bắt đầu
  @Prop()
  vip_start: Date;
  // ngày hết hạn
  @Prop()
  vip_end: Date;
  // ngày hết hạn
  @Prop()
  vip_expired: Date;
  // lợi ích
  @Prop({ type: [String] })
  benefits: string[];
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
  // loại gói
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
export class TypeLawyer extends Document {
  @Prop({ 
    required: true,
    enum: [
      'INSURANCE', // Bảo hiểm
      'CIVIL', // Dân sự
      'LAND', // Đất đai
      'CORPORATE', // Doanh nghiệp
      'TRANSPORTATION', // Giao thông - Vận tải
      'ADMINISTRATIVE', // Hành chính
      'CRIMINAL', // Hình sự
      'FAMILY', // Hôn nhân gia đình
      'LABOR', // Lao động
      'INTELLECTUAL_PROPERTY', // Sở hữu trí tuệ
      'INHERITANCE', // Thừa kế - Di chúc
      'TAX' // Thuế
    ]
  })
  type: string;


}
// loại luật sư con cháu chắt chút chít chịt
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
  parentType: Types.ObjectId;
  @Prop({ required: false, type: [String] })
  subType: string[];
}




// tạo 1 bảng booking, người dùng có thể thuê theo ngày, theo tháng hay theo năm với chính thằng luật sư đó, mình sẽ là người ăn hoa hồng
@Schema({ timestamps: true, collection: 'bookings' })
export class Booking extends Document {
  // Người dùng thuê luật sư
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;
  // Luật sư được thuê
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  lawyer_id: Types.ObjectId;

  @Prop()
  booking_date: Date;

  // trong trường hợp done 
  @Prop({ default: 'pending', enum: ['pending', 'confirmed', 'done', 'cancelled'] })
  status: string;

  @Prop()
  note: string;
}

@Schema({ timestamps: true, collection: 'reviews' })
export class Review extends Document {
  // Người dùng đánh giá
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

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
}




// tạo schema
export const UserSchema = SchemaFactory.createForClass(User);
export const VipPackageSchema = SchemaFactory.createForClass(VipPackage);
export const LearnPackageSchema = SchemaFactory.createForClass(LearnPackage);
export const TypeLawyerSchema = SchemaFactory.createForClass(TypeLawyer);
export const SubTypeLawyerSchema = SchemaFactory.createForClass(SubTypeLawyer); 
export const BookingSchema = SchemaFactory.createForClass(Booking);
export const ReviewSchema = SchemaFactory.createForClass(Review);