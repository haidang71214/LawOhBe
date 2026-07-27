import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  loginDto,
  RegisterDto,
  ResponseDto,
  LoginDataResponseDto,
  RegisterDataResponseDto,
} from './dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { KeyService } from 'src/shared/key/key.service';
import { EmailService } from 'src/shared/email/email.service';
import { RedisService, REDIS_KEYS, REDIS_TTL } from 'src/shared/redis';
import { v4 as uuidv4 } from 'uuid';
import { UsersRepository } from '../users/repository/users.repository';
import { AuthMapper } from './mapper/auth.mapper';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authMapper: AuthMapper,
    private readonly jwtService: JwtService,
    private readonly keyService: KeyService,
    private readonly mailService: EmailService,
    private readonly redisService: RedisService,
  ) {}

  async login(body: loginDto): Promise<ResponseDto<LoginDataResponseDto>> {
    const { email, password } = body;
    const findUser = await this.usersRepository.findByEmail(email);
    if (!findUser) {
      throw new BadRequestException('User not found');
    }

    if (!findUser.isEmailVerified) {
      const verificationToken = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      await this.redisService.set(
        REDIS_KEYS.EMAIL_OTP(email),
        verificationToken,
        REDIS_TTL.TEN_MINUTES,
      );

      await this.usersRepository.findByIdAndUpdate(findUser._id, {
        verificationToken,
      });

      try {
        await this.mailService.sendMail(
          email,
          'Account Verification Code',
          `Your verification code is: ${verificationToken}. This code is valid for 10 minutes. Click to verify: http://localhost:3002/verify-email?email=${encodeURIComponent(email)}&token=${verificationToken}`,
        );
      } catch (err) {
        console.error(
          'Failed to send verification email during login attempt:',
          err,
        );
      }

      throw new ForbiddenException(
        'Account is not activated. A new OTP has been sent to your email.',
      );
    }

    const checkPass = await bcrypt.compare(password, findUser.password);
    if (!checkPass) {
      throw new UnauthorizedException('Invalid password');
    }

    const token = this.jwtService.sign(
      { data: { userId: findUser._id } },
      {
        expiresIn: '7d',
        secret: this.keyService.getPrivateKey(),
        algorithm: 'RS256',
      },
    );

    const refToken = this.jwtService.sign(
      { data: { userId: findUser._id } },
      {
        expiresIn: '7d',
        secret: this.keyService.getRefTokenPrivateKey(),
        algorithm: 'RS256',
      },
    );

    await this.usersRepository.findByIdAndUpdate(findUser._id, {
      refresh_token: refToken,
      access_token: token,
    });

    const responseData = this.authMapper.toLoginResponseDto(token, findUser);

    return ResponseDto.success(responseData, 'Login successful', HttpStatus.OK);
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<ResponseDto<RegisterDataResponseDto>> {
    const { email, password, name, phone, age, province, avartar_url } =
      registerDto;

    const findUser = await this.usersRepository.findByEmail(email);
    if (findUser) {
      throw new ConflictException('Email is already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
      phone,
      age,
      province,
      role: 'user',
      avartar_url,
      isEmailVerified: false,
    });

    const token = this.jwtService.sign(
      { data: { userId: user._id } },
      {
        expiresIn: '7d',
        secret: this.keyService.getPrivateKey(),
        algorithm: 'RS256',
      },
    );

    const refToken = this.jwtService.sign(
      { data: { userId: user._id } },
      {
        expiresIn: '7d',
        secret: this.keyService.getRefTokenPrivateKey(),
        algorithm: 'RS256',
      },
    );

    await this.usersRepository.findByIdAndUpdate(user._id, {
      refresh_token: refToken,
      access_token: token,
    });

    const verificationToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // Lưu OTP vào Redis với TTL 10 phút
    await this.redisService.set(
      REDIS_KEYS.EMAIL_OTP(email),
      verificationToken,
      REDIS_TTL.TEN_MINUTES,
    );

    await this.usersRepository.findByIdAndUpdate(user._id, {
      verificationToken,
    });

    await this.mailService.sendMail(
      email,
      'Account Verification Code',
      `Your verification code is: ${verificationToken}. This code is valid for 10 minutes.`,
    );

    const responseData = this.authMapper.toRegisterResponseDto(user);

    return ResponseDto.success(
      responseData,
      'Registration successful. Please check your email for the verification code.',
      HttpStatus.CREATED,
    );
  }

  async verifyEmail(email: string, token: string): Promise<ResponseDto<null>> {
    // Kiểm tra OTP từ Redis trước
    const cachedOtp = await this.redisService.get<string>(
      REDIS_KEYS.EMAIL_OTP(email),
    );

    let user;
    if (cachedOtp) {
      if (cachedOtp !== token) {
        throw new BadRequestException('Invalid or expired verification code');
      }
      user = await this.usersRepository.findByEmail(email);
    } else {
      // Fallback về MongoDB nếu Redis key hết hạn hoặc chưa có
      user = await this.usersRepository.findOne({
        email,
        verificationToken: token,
      });
    }

    if (!user) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.usersRepository.findByIdAndUpdate(user._id, {
      isEmailVerified: true,
      verificationToken: null,
    });

    // Xóa OTP khỏi Redis sau khi verify thành công
    await this.redisService.del(REDIS_KEYS.EMAIL_OTP(email));

    return ResponseDto.success(
      null,
      'Email verified successfully. You can now login.',
      HttpStatus.OK,
    );
  }

  async resendVerificationEmail(email: string): Promise<ResponseDto<null>> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // Lưu OTP mới vào Redis
    await this.redisService.set(
      REDIS_KEYS.EMAIL_OTP(email),
      verificationToken,
      REDIS_TTL.TEN_MINUTES,
    );

    await this.usersRepository.findByIdAndUpdate(user._id, {
      verificationToken,
    });

    await this.mailService.sendMail(
      email,
      'Account Verification Code',
      `Your new verification code is: ${verificationToken}. This code is valid for 10 minutes.`,
    );

    return ResponseDto.success(
      null,
      'New verification code has been sent to your email.',
      HttpStatus.OK,
    );
  }

  async forgotPassword(email: string): Promise<ResponseDto<null>> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    const resetToken = uuidv4();

    // Lưu reset token vào Redis với TTL 15 phút
    await this.redisService.set(
      REDIS_KEYS.RESET_PASSWORD_TOKEN(resetToken),
      email,
      REDIS_TTL.FIFTEEN_MINUTES,
    );

    await this.usersRepository.findByIdAndUpdate(user._id, {
      reset_token: resetToken,
    });

    await this.mailService.sendMail(
      email,
      'Password Reset Request',
      `You requested a password reset. Use this token to reset your password: ${resetToken}\nThis token is valid for 15 minutes.`,
    );

    return ResponseDto.success(
      null,
      'Password reset token has been sent to your email.',
      HttpStatus.OK,
    );
  }

  async resetPassword(
    newPass: string,
    resetToken: string,
  ): Promise<ResponseDto<null>> {
    // Kiểm tra reset token từ Redis
    const cachedEmail = await this.redisService.get<string>(
      REDIS_KEYS.RESET_PASSWORD_TOKEN(resetToken),
    );

    let user;
    if (cachedEmail) {
      user = await this.usersRepository.findByEmail(cachedEmail);
    } else {
      user = await this.usersRepository.findOne({ reset_token: resetToken });
    }

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await this.usersRepository.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      reset_token: null,
    });

    // Xóa reset token khỏi Redis
    await this.redisService.del(REDIS_KEYS.RESET_PASSWORD_TOKEN(resetToken));

    return ResponseDto.success(
      null,
      'Password changed successfully',
      HttpStatus.OK,
    );
  }

  async loginWithFacebook(
    id: string,
    email: string,
    full_name: string,
    avatar_url: string,
  ): Promise<ResponseDto<{ token: string }>> {
    let checkUser = await this.usersRepository.findByEmail(email);

    if (!checkUser) {
      checkUser = await this.usersRepository.create({
        face_id: id,
        email,
        password: uuidv4(),
        name: full_name,
        role: 'user',
        avartar_url: avatar_url,
        isEmailVerified: true,
      });
    }

    await this.usersRepository.findOneAndUpdate({ email }, { face_id: id });

    const token = this.jwtService.sign(
      { data: { userId: checkUser._id } },
      {
        expiresIn: '7d',
        secret: this.keyService.getPrivateKey(),
        algorithm: 'RS256',
      },
    );

    const refToken = this.jwtService.sign(
      { data: { userId: checkUser._id } },
      {
        expiresIn: '7d',
        secret: this.keyService.getRefTokenPrivateKey(),
        algorithm: 'RS256',
      },
    );

    await this.usersRepository.findByIdAndUpdate(checkUser._id, {
      refresh_token: refToken,
      access_token: token,
    });

    return ResponseDto.success(
      { token },
      'Facebook login successfully',
      HttpStatus.OK,
    );
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<ResponseDto<{ accessToken: string }>> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const user = await this.usersRepository.findOne({
      refresh_token: refreshToken,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = this.jwtService.sign(
      { data: { userId: user._id } },
      {
        expiresIn: '7d',
        secret: this.keyService.getPrivateKey(),
        algorithm: 'RS256',
      },
    );

    return ResponseDto.success(
      { accessToken: newAccessToken },
      'Token renewed successfully',
      HttpStatus.OK,
    );
  }

  async getProfile(userId: string): Promise<ResponseDto<any>> {
    const user = await this.usersRepository.findById(
      userId,
      undefined,
      '-password -refresh_token -access_token',
    );
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return ResponseDto.success(
      user,
      'User profile retrieved successfully',
      HttpStatus.OK,
    );
  }
}
