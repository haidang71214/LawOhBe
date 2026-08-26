import { ApiProperty } from '@nestjs/swagger';

export class ChangeRoleDto {
  @ApiProperty()
  newRole: string;
}