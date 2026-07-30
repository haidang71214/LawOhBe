import { USER_ROLE } from 'libs/constant';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateLawyerUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  phone?: number;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  img?: any;

  @ApiHideProperty()
  avartar_url?: string;

  @ApiProperty({ required: false })
  age?: number;

  @ApiProperty({ enum: USER_ROLE, required: false })
  @IsOptional()
  @IsEnum(USER_ROLE)
  role?: USER_ROLE;

  @ApiProperty({ required: false })
  province?: string;
}

export class UpdateLawyerUserRequestDto extends UpdateLawyerUserDto {}
