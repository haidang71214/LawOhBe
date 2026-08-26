import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

import { Response } from 'express';
import { loginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudUploadService } from 'src/shared/cloudUpload.service';
import { SendToken } from './dto/sendTokenReset.dto';
import { changePass } from './dto/changePass.dto';
import { LoginFacebookDto } from './dto/loginFacebook.dto';
import {  TokenControllerService } from 'utils/token.utils';
import { Model } from 'mongoose';
import { User } from 'src/config/database.config';
import { CustomRequest } from './custom-request';
import { InjectModel } from '@nestjs/mongoose'; // ý là vẫn chưa biết cái này lắm

//  Promise<Response<string>> 

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
  private readonly cloudUploadService : CloudUploadService,
  @InjectModel(User.name) private readonly userModel: Model<User>, 
private readonly TokenHeheControllerService: TokenControllerService
  ) {}
// đăng nhập, trả ra token 
  @Post("/loginUser")
  async create(
    @Body() loginDto:loginDto,
    @Res() res: Response,
  ) {
    try {
      const response = await this.authService.login(loginDto);
      // 
      return res.status(response.status).json({token : response.token});
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
  // đăng kí
  @Post('register')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('img'))
  async register(@Res() res, @Body() body: RegisterDto,
   @UploadedFile() file: Express.Multer.File) {
  if (file) {
      try {
        const uploadResult = await this.cloudUploadService.uploadImage(file, 'avatar');
        body.avartar_url = uploadResult.secure_url;
      } catch (error) {
        return res.status(500).json(error.message);
      }
    const response = await this.authService.register(body);
    return res.status(response.status).json(response.message);
    }
  }
// gửi reset code
  @Post('/ForgotPassWord') 
  async shiet(
  @Body() body: SendToken, 
  @Res() res: Response        
  ): Promise<any> {
  const email = body.email
  try {
    const response = await this.authService.forGotPass(email);
    return res.status(response.status).json(response.message);
  } catch (error) {
    throw new Error(error);
  }
}

// check reset code với thay pass
  @Post('/ChagePassWord')
  @ApiResponse({ status: 200, description: 'Password updated successfully.' })
  async changePass(
    @Body()body:changePass,
    @Res()res:Response
  ){
    try {
    const  { newPass, resetToken} = body
    const response =  await this.authService.resetPass(newPass,resetToken)
      
     return res.status(response.status).json(response.message);
    } catch (error) {
      throw new Error(error)
    }
  }

 
  
  @Post('/LoginFaceBook')
  async loginFaceBook(
  @Body() body: LoginFacebookDto,
    @Res() res: Response
  ):  Promise<Response<string>> {
     try {
   const response = await this.authService.loginFacebook(body.id, body.email, body.full_name, body.avartar_url);

    return res.status(response.status).json(response.message);
  } catch (error) {
    throw new Error(error)
  } 
  }


  // cái này làm cokkie
   @Post('/extend-token')
  async extendToken(@Req() req: CustomRequest, @Res() res: Response) {
    try {
      // Truy cập refresh token từ cookies
      const refreshToken = req.cookies.refreshToken;
      // Kiểm tra nếu không có refresh token
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token missing' });
      }

      // Tìm user với refresh token
      const user = await this.userModel.findOne({
     refresh_token: refreshToken 
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      // Tạo Access Token mới (ví dụ sử dụng một hàm tạo token)
      // ngửi thấy mùi sai ở đây
      const newAccessToken = this.TokenHeheControllerService.createTokenAsyncKey({ userId: user._id  });

      return res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

}
