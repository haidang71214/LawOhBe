import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudUploadService } from 'src/shared/cloudUpload.service';
import { EmailService } from 'src/email/email.service';
import { Model } from 'mongoose';
import { Booking, Review, User } from 'src/config/database.config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';
@Injectable()
export class UsersService {
  constructor(
    private readonly cloudUploadService: CloudUploadService,
    private readonly mailService : EmailService, // mình đoán cái này sẽ có động tới mail
     private readonly authService  :AuthService,
   @InjectModel(User.name) private readonly user_model : Model<User>,
    @InjectModel(Booking.name) private BookingModel: Model<Booking>,
    @InjectModel(Review.name) private ReviewModel: Model<Review>,
  
  ){}


  async create(createUserDto: CreateUserDto,userId:number) {
 try {
  const checkAdmin = await this.user_model.findById(userId);
  if(checkAdmin?.role !== "admin"){
    return {
      status:500,
      message:"Khong co quyen"
    }
  }
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
const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
  // tạo user mới thành công
  const results = await this.user_model.create({
    password:hashedPassword,
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
async findAll(userId: string, role?: string) {
  try {
    const isAdmin = await this.authService.checkAdmin(userId);
    if (!isAdmin) {
      return {
        status: 200,
        message: "Không đủ quyền"
      };
    } else {
      const users = await this.user_model.find();
      // Nếu role được cung cấp, lọc theo role, nếu không, trả về tất cả
      const filteredUsers = role ? users.filter(user => user.role === role) : users;
      // sắp xếp 
     const sortedUsers = filteredUsers.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
     
     return {
        status: 200,
        data: sortedUsers
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
    else{
        return {
        status: 200,
        data: {
          user: responseUser,
          bookingLawyer,
          reviewLawyer
        },
      };
    }
  } catch (error) {
    throw new Error(error);
  }
}


// khi đăng nhập, mặc định là xác định cái role ở đó luôn
// muốn cập nhật cái description thì phải vào đây
// cái ở dưới cho role là admin mới được cập nhật, còn xíu mình đá qua luật sư thì mình cho nó tự cập nhật cái description
// update người, bao gồm cả thằng luật sư và thằng khách hàng
  async updateTheoAdmin(
    id: string,
    updateUserDto: UpdateUserDto,
  userId:string) {
    const CheckAdmin = await this.authService.checkAdmin(id);
    if(!CheckAdmin){
      return{
        status:404,
        message:'Không có quyền'
      }
    }
   try {
    // tìm với cái id
    const{password,phone,name,avartar_url,role,province,warn} = updateUserDto
   const hashedPassword = await bcrypt.hash(password, 10);
     await this.user_model.findByIdAndUpdate(id,{
        password : hashedPassword,
        phone,
        name,
        avartar_url,
        role,
        province,
        warn
      })

    return{
      status:200,
      message:'Update Thành Công, reload lại để cập nhật'
    }
   } catch (error) {
    throw new Error(error)
   }
  }


  // user
  async updateTheoUser(userId:string,updateUserDto:UpdateUserDto){
    try {
      const{name,phone,role,age,password,avartar_url,province,warn} = updateUserDto
         const hashedPassword = await bcrypt.hash(password, 10);
      await this.user_model.findByIdAndUpdate(userId,{
        name,
        phone,
        role,
        age,
        password : hashedPassword,
        avartar_url,
        province,warn
      });
      return {
        status:200,
        message:'Update thành công'
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  // ở đây, mình chưa có cập nhật những cái bảng liên quan nên chưa làm trước
  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
