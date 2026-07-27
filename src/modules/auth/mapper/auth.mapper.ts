import { Injectable } from '@nestjs/common';
import { User } from 'libs/schemas';
import { toDto } from 'libs/utils/mapper.util';
import { LoginDataResponseDto, RegisterDataResponseDto } from '../dto';

@Injectable()
export class AuthMapper {
  toLoginResponseDto(token: string, user: User): LoginDataResponseDto {
    const userObj =
      user && typeof (user as any).toObject === 'function'
        ? (user as any).toObject()
        : { ...user };

    return toDto(LoginDataResponseDto, {
      token,
      user: {
        ...userObj,
        password: '',
        refToken: undefined,
        access_token: undefined,
        refresh_token: undefined,
      },
    });
  }

  toRegisterResponseDto(user: any): RegisterDataResponseDto {
    return toDto(RegisterDataResponseDto, {
      id: user._id?.toString() || user.id,
      email: user.email,
      name: user.name,
    });
  }
}
