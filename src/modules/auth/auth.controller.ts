import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  loginDto,
  RegisterDto,
  VerifyEmailDto,
  ResendVerifyEmailDto,
  SendToken,
  changePass,
  LoginFacebookDto,
  ResponseDto,
  LoginDataResponseDto,
  RegisterDataResponseDto,
} from './dto';
import { ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudUploadService } from 'src/shared/cloudinary/cloudUpload.service';
import { CustomRequest } from './custom-request';
import { AuthorizerDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cloudUploadService: CloudUploadService,
  ) {}

  @Post('/login')
  async login(
    @Body() loginDto: loginDto,
  ): Promise<ResponseDto<LoginDataResponseDto>> {
    return this.authService.login(loginDto);
  }

  @Post('/register')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('img'))
  async register(
    @Body() body: RegisterDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<RegisterDataResponseDto>> {
    if (file) {
      const uploadResult = await this.cloudUploadService.uploadImage(
        file,
        'avatar',
      );
      body.avartar_url = uploadResult.secure_url;
    }
    return this.authService.register(body);
  }

  @Post('/verify-email')
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  async verifyEmail(@Body() body: VerifyEmailDto): Promise<ResponseDto<null>> {
    return this.authService.verifyEmail(body.email, body.token);
  }

  @Post('/resend-verification')
  @ApiResponse({
    status: 200,
    description: 'Verification code resent successfully.',
  })
  async resendVerificationEmail(
    @Body() body: ResendVerifyEmailDto,
  ): Promise<ResponseDto<null>> {
    return this.authService.resendVerificationEmail(body.email);
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() body: SendToken): Promise<ResponseDto<null>> {
    return this.authService.forgotPassword(body.email);
  }

  @Post('/reset-password')
  @ApiResponse({ status: 200, description: 'Password updated successfully.' })
  async resetPassword(@Body() body: changePass): Promise<ResponseDto<null>> {
    return this.authService.resetPassword(body.newPass, body.resetToken);
  }

  @Post('/facebook-login')
  async loginWithFacebook(
    @Body() body: LoginFacebookDto,
  ): Promise<ResponseDto<{ token: string }>> {
    return this.authService.loginWithFacebook(
      body.id,
      body.email,
      body.full_name,
      body.avartar_url,
    );
  }

  @Post('/refresh-token')
  async refreshToken(
    @Req() req: CustomRequest,
  ): Promise<ResponseDto<{ accessToken: string }>> {
    const refreshToken = req.cookies?.refreshToken;
    return this.authService.refreshToken(refreshToken);
  }

  @Get('/me')
  @AuthorizerDecorator({ secured: true })
  async getProfile(
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<any>> {
    return this.authService.getProfile(user.userId);
  }
}
