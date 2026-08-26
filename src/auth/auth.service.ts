import { HttpStatus, Injectable } from '@nestjs/common';

import { loginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/config/database.config';
import { JwtService } from '@nestjs/jwt';
import { KeyService } from 'src/key/key.service';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from 'src/email/email.service';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class AuthService {

constructor(
@InjectModel(User.name) private readonly user_model : Model<User>,
private readonly jwtService : JwtService,
private readonly keyService : KeyService,
 private readonly mailService : EmailService
){}
async checkAdmin(userId: string): Promise<boolean> {
  try {
    const user = await this.user_model.findById(userId);
    if (user?.role === 'admin') {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw new Error(error);
  }
}
async checkLawyer(userId: string): Promise<boolean> {
  try {
    const user = await this.user_model.findById(userId);
    if (user?.role === 'lawyer') {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw new Error(error);
  }
}
async checkUser(userId: string): Promise<boolean> {
  try {
    const user = await this.user_model.findById(userId);
    if (user?.role === 'user') {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw new Error(error);
  }
}
  async login(body:loginDto):Promise<any>{
    try {
      const {email,password} = body;
      const findUser = await this.user_model.findOne({email:email})
      if(!findUser){
        return {
          status:400,
          message:'"User not found"'
        }   
      };
       if (!findUser) {
        throw new Error('không có trong hệ thống');
      }
      
      const checkPass = await bcrypt.compare(password, findUser.password);
      if (!checkPass) {
        throw new Error('sai password');
      }
      // trong này hắn sẽ mã hóa cái cục 
      const token = this.jwtService.sign(
        { data: { userId: findUser._id } },
        { expiresIn: '7d',
          secret: this.keyService.getPrivateKey(),
          algorithm: 'RS256',}
      )
        const refToken = this.jwtService.sign(
        { data: { userId: findUser._id } },
        {
          expiresIn: '7d',
          secret: this.keyService.getRefTokenPrivateKey(),
          algorithm: 'RS256',
        },
      );
// thay đổi trong chỗ user
     await this.user_model.findByIdAndUpdate(
        findUser._id,
     {refresh_token: refToken,access_token: token},
    { new: true } // optional: nếu muốn lấy document đã cập nhật
);
// 
  return {
      status: 200,
      token,
      user: { ...findUser.toObject(), password: undefined, refToken: undefined, access_token: undefined, refresh_token: undefined },
    };
    } catch (error) {
 throw new Error(error);
    }
  }

  async register(body: RegisterDto): Promise<any> {
    try {
      const existingUser = await this.user_model.findOne({ email: body.email });
      if (existingUser) {
        return { status: 409, message: 'Email already in use' };
      }
  
      const hashedPassword = await bcrypt.hash(body.password, 10);
      const data = {
        email: body.email,
        name: body.name,
        password: hashedPassword,
        phone: body.phone,
        avartar_url: body.avartar_url,
        age:body.age,
        role:'user', 
        province : body.province,
      };
      this.mailService.sendMail(data.email,"Bạn đã đăng kí thành công","bạn đẹp trai vãi l")
      const createdUser = await this.user_model.create(data);
      return { status: 200, message: createdUser };
    } catch (error) {
      console.error('Error during registration:', error);
      return { status: 500, message: 'Internal server error', error: error.message };
    }
  }

  async forGotPass(email: String): Promise<any> {
    try {
      // chỗ này nó sẽ tìm theo mail
      const response = await this.user_model.findOne({email});
      if(!response){
        return "Email không tồn tại"
      }
     
      const resetKey = uuidv4().slice(0, 7);
      await this.user_model.findByIdAndUpdate(response._id,{
        reset_token: resetKey // để lưu vô db
      });
      this.mailService.sendMail(response.email,"Đây là mã reset", resetKey);

      return{
        status:200,
        message:"Gửi đi thành công, hãy check mail để lấy token"
      }
    } catch (error) {
      throw new Error(error)
    }
  }

async resetPass(newPass: String, resetToken: String): Promise<any> {
    try {
        // Kiểm tra đầu vào
        if (!newPass || !resetToken) {
            throw new Error('Thiếu thông tin mật khẩu mới hoặc reset token');
        }

        // Tìm người dùng có reset_token khớp
        const checkUser = await this.user_model.findOne({
                reset_token: resetToken,
        });

        if (!checkUser) {
            throw new Error('Reset token không hợp lệ hoặc đã hết hạn');
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPass, 10);

        // Cập nhật mật khẩu và xóa reset_token
        await this.user_model.findByIdAndUpdate(  checkUser._id  ,{
             
                password: hashedPassword,
                reset_token: null, // Reset token bị vô hiệu hóa sau khi sử dụng
            
        });

        return {
          status:200,
          message:"Thay đổi thành công"
        }

    } catch (error) {
        console.error('Error in resetPass:', error.message || error);
        throw new Error('Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại sau.');
    }
}
// login face
async loginFacebook(
   id: string,
    email: string,
    full_name: string,
    avatar_url: string,
){
  try {
      // Kiểm tra xem người dùng đã tồn tại trong hệ thống chưa
      let checkUser = await this.user_model.findOne({email:email})

      // Nếu người dùng chưa tồn tại, tạo mới người dùng
      if (!checkUser) {
        checkUser = await this.user_model.create({
          data: {
            face_id: id,
            email,
            password: uuidv4(),
            name: full_name,
            role: 'user', // Gán role mặc định là user
            avartar_url: avatar_url,
          },
        });
      }
// nếu không
   await this.user_model.findOneAndUpdate(
  { email },              // filter
  { face_id: id },        // update
);


      // Tạo token JWT cho người dùng
      const token = this.jwtService.sign(
        { data: { userId: checkUser._id } },
        {
          expiresIn: '7d',
          secret: this.keyService.getPrivateKey(),
          algorithm: 'RS256',
        },
      );

      // Cập nhật lại refresh token nếu cần thiết
      const refToken = this.jwtService.sign(
        { data: { userId: checkUser._id } },
        {
          expiresIn: '7d',
          secret: this.keyService.getRefTokenPrivateKey(),
          algorithm: 'RS256',
        },
      );

      await this.user_model.findByIdAndUpdate( checkUser._id ,{
        refresh_token: refToken, access_token: token 
      });

      return {
        status:HttpStatus.OK,
        message:token
      };
  } catch (error) {
    throw new Error(error)
  }
}


}
