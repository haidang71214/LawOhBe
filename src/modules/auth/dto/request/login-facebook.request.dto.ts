import { ApiProperty } from '@nestjs/swagger';

export class LoginFacebookDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  avartar_url: string;
}

export class LoginFacebookRequestDto extends LoginFacebookDto {}
