import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class LoginDataResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  user: any;
}

export class RegisterDataResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;
}

export class LoginResponseDto extends ResponseDto<LoginDataResponseDto> {}
export class RegisterResponseDto extends ResponseDto<RegisterDataResponseDto> {}
export class VerifyEmailResponseDto extends ResponseDto<null> {}
export class ResendVerifyEmailResponseDto extends ResponseDto<null> {}
export class ForgotPasswordResponseDto extends ResponseDto<null> {}
export class ChangePasswordResponseDto extends ResponseDto<null> {}
