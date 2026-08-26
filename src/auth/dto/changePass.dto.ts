import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class changePass {
  @ApiProperty()
  @IsNotEmpty()
  newPass: string;

  @ApiProperty()
  @IsNotEmpty()
  resetToken: string;
}
