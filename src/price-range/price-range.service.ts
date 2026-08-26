import { Injectable } from '@nestjs/common';
import { UpdatePriceRangeDto } from './dto/update-price-range.dto';
import { Booking, CustomPrice, MarketPriceRange, Payment, User } from 'src/config/database.config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomPriceRangeDto } from './dto/create-price-range.dto';
import { updatePriceBylawyerDto } from './dto/update-byLawyerDto';
@Injectable()
export class PriceRangeService {
  constructor(
      @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(MarketPriceRange.name) private MarketPriceRangeModel: Model<MarketPriceRange>,
    @InjectModel(CustomPrice.name) private CustomPriceModel: Model<CustomPrice>,
    @InjectModel(Booking.name) private BookingModel: Model<Booking>,
  ){}

// hàm tạo giá cá nhân
  async createHehe(userId:string,body:CustomPriceRangeDto){
    try {
      const checkLaywer = await this.UserModel.findById(userId);
      const {Type,price,description} = body
      if(checkLaywer?.role === 'lawyer'){
      // check điều kiện
      const checkPrice = await this.MarketPriceRangeModel.findOne({
        type:Type
      });
// check cái customprice đã tồn tại chưa, nếu có 1 cái customprice tương tự thì thay thế nó
    if (checkPrice && price >= checkPrice.minPrice && price <= checkPrice.maxPrice){
      const checkGiaTonTai = await this.CustomPriceModel.findOne({lawyer_id:userId,type:Type})
      if(checkGiaTonTai){
        // nếu tồn tại thì thay đổi
          await this.CustomPriceModel.replaceOne({_id:checkGiaTonTai._id},{
            lawyer_id: userId,
            type: Type,
            price,
            description
          }    
          )
          return {
            status: 200,
            message: 'Setup giá thành công'
          };
      }
  await this.CustomPriceModel.create({
       lawyer_id: userId,
       type: Type,
       price,
       description
  });
// cần phải có 1 cái check là đã cập nhật chưa, nếu cập nhật rồi thì update, chứ không tạo mới
  return {
    status: 200,
    message: 'Setup giá thành công'
  };
}
const formattedMinPrice = checkPrice?.minPrice.toLocaleString('vi-VN');
      const formattedMaxPrice = checkPrice?.maxPrice.toLocaleString('vi-VN');
  return{
    status:404,
    message:`Giá phải trong khoảng của ${formattedMinPrice} VND tới ${formattedMaxPrice} VND`
  }

      }
      return {
        status:401,
        message:"Yêu cầu là luật sư"
      }
    } catch (error) {
      throw new Error(error)
    }
  }


  async findAll() {
   try {
    const results = await this.MarketPriceRangeModel.find();
    return{
      status:200,
      results
    }
   } catch (error) {
    throw new Error(error)
   }
  }
  async findOne(id:string) {
  try {
    const response = await this.MarketPriceRangeModel.findOne({type:id})
    return{
      status:200,
      message:response
    } 
  } catch (error) {
    throw new Error(error)
  }
  }
  async update(type: string, updatePriceRangeDto: UpdatePriceRangeDto, userId: string) {
    try {
      // Kiểm tra quyền admin
      const checkUser = await this.UserModel.findById(userId);
      if (!checkUser || checkUser.role !== 'admin') {
        return {
          status: 403,
          message: 'Không đủ quyền truy cập',
        };
      }
  
      if (updatePriceRangeDto.maxPrice <= updatePriceRangeDto.minPrice) {
        return {
          status: 404,
          message: 'Giá thấp nhất không được lớn hơn hoặc bằng giá cao nhất',
        };
      }
      const normalizedType = type.trim().toUpperCase();
      console.log(`Type được truyền vào: ${normalizedType}`);
      const customPrices = await this.CustomPriceModel.find({ type: normalizedType });
  
      for (const item of customPrices) {
        if (item.price > updatePriceRangeDto.maxPrice) {
          await this.CustomPriceModel.findByIdAndUpdate(item._id, {
            price: updatePriceRangeDto.maxPrice,
          });
          const bookings = await this.BookingModel.find({
            lawyer_id: item.lawyer_id,
            typeBooking: item.type,
          });
  
          for (const booking of bookings) {
            if (booking.booking_start && booking.booking_end) {
              const days = (booking.booking_end.getTime() - booking.booking_start.getTime()) / (1000 * 60 * 60 * 24);
              const income = (days * updatePriceRangeDto.maxPrice).toFixed(2);
              await this.BookingModel.findByIdAndUpdate(booking._id, { income });
            }
          }
        } else if (item.price < updatePriceRangeDto.minPrice) {
          // Cập nhật lại giá thành minPrice
          await this.CustomPriceModel.findByIdAndUpdate(item._id, {
            price: updatePriceRangeDto.minPrice,
          });
  
          // Cập nhật thu nhập booking tương ứng
          const bookings = await this.BookingModel.find({
            lawyer_id: item.lawyer_id,
            typeBooking: item.type,
          });
  
          for (const booking of bookings) {
            if (booking.booking_start && booking.booking_end) {
              const days = (booking.booking_end.getTime() - booking.booking_start.getTime()) / (1000 * 60 * 60 * 24);
              const income = (days * updatePriceRangeDto.minPrice).toFixed(2);
              await this.BookingModel.findByIdAndUpdate(booking._id, { income });
            }
          }
        }
      }
  
      // Cập nhật bảng MarketPriceRange
      await this.MarketPriceRangeModel.findOneAndUpdate(
        { type: normalizedType },
        {
          minPrice: updatePriceRangeDto.minPrice,
          maxPrice: updatePriceRangeDto.maxPrice,
          description: updatePriceRangeDto.description,
        },
        { new: true }
      );
  
      return {
        status: 200,
        message: 'Cập nhật thành công',
      };
    } catch (error) {
      return {
        status: 500,
        message: `Lỗi server: ${error.message}`,
      };
    }
  }
  

async updateLawyerService(userId:string,body:updatePriceBylawyerDto){
 try {
      const checkLaywer = await this.UserModel.findById(userId);
      const {Type,price,description} = body
      if(checkLaywer?.role === 'lawyer'){
      // check điều kiện
      const checkPrice = await this.MarketPriceRangeModel.findOne({
        type:Type
      });

    if (checkPrice && price >= checkPrice.minPrice && price <= checkPrice.maxPrice) {
  await this.CustomPriceModel.findOneAndUpdate({
    type:Type,
    lawyer_id:checkLaywer._id
  },{
    type:Type,
    lawyer_id:userId,
    price,
    description
  });

  return {
    status: 200,
    message: 'Setup giá thành công'
  };
}
const formattedMinPrice = checkPrice?.minPrice.toLocaleString('vi-VN');
  const formattedMaxPrice = checkPrice?.maxPrice.toLocaleString('vi-VN');
  return{
    status:404,
    message:`Giá phải trong khoảng của ${formattedMinPrice} tới ${formattedMaxPrice}`
  }
      }
      return {
        status:401,
        message:"Yêu cầu là luật sư"
      }
    } catch (error) {
      throw new Error(error)
    }
}
}
