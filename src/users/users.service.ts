import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Model } from 'mongoose';
import { Booking, Review, User } from 'src/config/database.config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';
@Injectable()
export class UsersService {
  constructor(
     private readonly authService  :AuthService,
   @InjectModel(User.name) private readonly user_model : Model<User>,
    @InjectModel(Booking.name) private BookingModel: Model<Booking>,
    @InjectModel(Review.name) private ReviewModel: Model<Review>,
  
  ){}
// hàm checkadmin

  async create(createUserDto: CreateUserDto) {
 try {
  // tìm email với phone trùng lặp
  const checkEmail = await this.user_model.findOne({email:createUserDto.email})
  if(checkEmail){
     return {
      status:400,
      message:"Email bị trùng lặp"
    }
  }
  const checkPhone = await this.user_model.findOne({phone:createUserDto.phone})
  if(checkPhone){
     return {
      status:400,
      message:"Số điện thoại bị trùng lặp"
    }
  }
  console.log(createUserDto);
  
const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
  // tạo user mới thành công
  const results = await this.user_model.create({
    password:hashedPassword,
    email:createUserDto.email,
    phone:createUserDto.phone,
    name:createUserDto.name,
    avartar_url:createUserDto.avartar_url,
    age:createUserDto.age,
    role:createUserDto.role,
    province:createUserDto.province,
    warn:createUserDto.warn
  });
  return {status:200,
    message:results
  }
 } catch (error) {
  throw new Error(error)
 }
  }
// quản lí tất cả người dùng, filter theo các role: lawyer,user
async findAll(userId: string) {
  try {
    const isAdmin = await this.authService.checkAdmin(userId);
    if (!isAdmin) {
      return {
        status: 400,
        message: "Không đủ quyền"
      };
    } else {
      const users = await this.user_model.find()
     return {
        status: 200,
        data: users
      };
    }
  } catch (error) {
    throw new Error(error);
  }
}

async findOne(id: string) {
  try {
    const responseUser = await this.user_model.findById(id)
    const bookingUser =  await this.BookingModel.find({user_id:responseUser?._id}).populate("lawyer_id")
    const reviewUser = await this.ReviewModel.find({user_id:responseUser?._id}).populate("lawyer_id")

    const bookingLawyer = await this.BookingModel.find({lawyer_id:responseUser?._id}).populate('user_id');
    const reviewLawyer= await this.BookingModel.find({lawyer_id:responseUser?._id}).populate('user_id')
    // hiện review của khách hàng
    if(responseUser?.role === 'user'){
        return {
        status: 200,
        data: {
          user: responseUser,
          bookingUser,
          reviewUser
        },
      };
    }
    // return ra theo hướng của thằng luật sư
    else if(responseUser?.role === 'lawyer'){
        return {
        status: 200,
        data: {
          user: responseUser,
          bookingLawyer,
          reviewLawyer
        },
      };
    }
    // này là của admin
    else{
        return {
        status: 200,
        data: {
          user: responseUser,
        },
      };
    }
  } catch (error) {
    throw new Error(error);
  }
}

async changeRoleToUser(
  id:string,newRole:string,userId:string
){
  console.log(newRole);
  
  const hehe = await this.authService.checkAdmin(userId)
  if(hehe){
    const user = await this.user_model.findById(id);
    if (!user) {
      return { status: 404, message: 'User không tồn tại' };
    }

    // Thay đổi role
    user.role = newRole;
    await user.save();
       
  return user
  }

}

// khi đăng nhập, mặc định là xác định cái role ở đó luôn
// muốn cập nhật cái description thì phải vào đây
// cái ở dưới cho role là admin mới được cập nhật, còn xíu mình đá qua luật sư thì mình cho nó tự cập nhật cái description
// update người, bao gồm cả thằng luật sư và thằng khách hàng
async updateTheoAdmin(
  id: string,
  updateUserDto: UpdateUserDto,
  userId: string
) {
  const CheckAdmin = await this.authService.checkAdmin(userId);
  if (CheckAdmin === false) {
    return {
      status: 404,
      message: "Không có quyền",
    };
  }

  try {
    // Lấy các trường ra
    const { password, phone, name, avartar_url, role, province } = updateUserDto;

    // Tạo đối tượng updateData rỗng
    const updateData: any = {};

    // Nếu có password thì hash và update
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Nếu các trường khác không undefined hoặc null thì thêm vào updateData
    if (phone !== undefined && phone !== null) updateData.phone = phone;
    if (name !== undefined && name !== null) updateData.name = name;
    if (avartar_url !== undefined && avartar_url !== null) updateData.avartar_url = avartar_url;
    if (role !== undefined && role !== null) updateData.role = role;
    if (province !== undefined && province !== null) updateData.province = province;

    // Cập nhật nếu có trường nào để update
    if (Object.keys(updateData).length === 0) {
      return {
        status: 400,
        message: "Không có trường nào để cập nhật",
      };
    }

    await this.user_model.findByIdAndUpdate(id, updateData);

    return {
      status: 200,
      message: "Update Thành Công, reload lại để cập nhật",
    };
  } catch (error) {
    throw new Error(error);
  }
}



  // user
  async updateTheoUser(userId: string, updateUserDto: UpdateUserDto) {
    try {
      const { name, phone, role, age, password, avartar_url, province } = updateUserDto;

      // Tạo object để cập nhật, chỉ bao gồm các trường có giá trị
      const updateFields: any = {};

      if (name) updateFields.name = name;
      if (phone) updateFields.phone = phone;
      if (role) updateFields.role = role;
      if (age) updateFields.age = age;
      if (avartar_url) updateFields.avartar_url = avartar_url;
      if (province) updateFields.province = province;

      // Chỉ mã hóa và cập nhật password nếu nó tồn tại và không rỗng
      if (password && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.password = hashedPassword;
      }
      const updatedUser = await this.user_model.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true }, 
      );

      if (!updatedUser) {
        throw new Error('User not found');
      }
      return {
        status: 200,
        message: 'Update thành công',
      };
    } catch (error) {
      console.log(error);
      throw new Error(error.message || 'Update thất bại');
    }
  }
  
  async findShiet(userId: string) {
    try {
      const bookings = await this.BookingModel.find(
        { client_id: userId }, 
      );
      return {
        status: 200,
        data: bookings, 
      };
    } catch (error) {
      throw new Error(error);
    }
  }

}
