import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  phone?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  img?: any;

  @ApiHideProperty()
  @IsOptional()
  avartar_url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  age?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  province?: string;
}

export class RegisterRequestDto extends RegisterDto {}
