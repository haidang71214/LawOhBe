import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SendToken {
  @ApiProperty()
  @IsNotEmpty()
  email: string;
}

export class SendTokenResetRequestDto extends SendToken {}
