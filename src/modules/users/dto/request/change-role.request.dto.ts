import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangeRoleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  newRole: string;
}

export class ChangeRoleRequestDto extends ChangeRoleDto {}
