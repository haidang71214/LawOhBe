import { Injectable } from '@nestjs/common';
import { UpdatePriceRangeDto } from './dto/update-price-range.dto';
import { CustomPrice, MarketPriceRange, User } from 'src/config/database.config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { EmailService } from 'src/email/email.service';
import { CloudUploadService } from 'src/shared/cloudUpload.service';
import { CustomPriceRangeDto } from './dto/create-price-range.dto';
import { updatePriceBylawyerDto } from './dto/update-byLawyerDto';
@Injectable()
export class PriceRangeService {
  constructor(
      private readonly cloudUploadService : CloudUploadService,
      private readonly mailService : EmailService,
      private readonly authService : AuthService,
      @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(MarketPriceRange.name) private MarketPriceRangeModel: Model<MarketPriceRange>,
    @InjectModel(CustomPrice.name) private CustomPriceModel: Model<CustomPrice>
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

// hiện chi tiết của cái Etype
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

  async update(type: string, updatePriceRangeDto: UpdatePriceRangeDto,userId:string) {
    try {
      const checkUser = await this.UserModel.findById(userId);
      if(checkUser?.role === 'admin'){
      await this.MarketPriceRangeModel.findOneAndUpdate({
        type:type
      },{
        minPrice:updatePriceRangeDto.minPrice,
        maxPrice:updatePriceRangeDto.maxPrice,
        description:updatePriceRangeDto.description
      })
      return{
        status:200,
        massage:"Update thành công"
      }
      } 
      return{
        status:404,
        massage:"Không đủ quyền"
      }
    } catch (error) {
      throw new Error(error)
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
