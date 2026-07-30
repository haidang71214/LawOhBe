import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { USER_ROLE } from 'libs/constant';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsOptional()
  phone: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  img?: any;

  @ApiHideProperty()
  avartar_url: string;

  @ApiProperty()
  age: number;

  @ApiProperty({ enum: USER_ROLE })
  @IsEnum(USER_ROLE)
  role: USER_ROLE;

  @ApiProperty()
  province: string;

  @ApiProperty()
  warn: string;
}

export class CreateUserRequestDto extends CreateUserDto {}
