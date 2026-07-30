import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class UserItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  phone?: number;

  @ApiProperty({ required: false })
  avartar_url?: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ required: false })
  province?: string;

  @ApiProperty({ required: false })
  age?: number;

  @ApiProperty({ required: false })
  isEmailVerified?: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  experienceYear?: number;

  @ApiProperty({ type: [String], required: false })
  certificate?: string[];

  @ApiProperty({ required: false })
  lawyer_request_status?: string;

  @ApiProperty({ required: false })
  lawyer_request_reason?: string;

  @ApiProperty({ type: [String], required: false })
  pending_type_lawyer?: string[];

  @ApiProperty({ type: [String], required: false })
  pending_sub_type_lawyers?: string[];
}

export class UserListResponseDataDto {
  @ApiProperty({ type: [UserItemResponseDto] })
  data: UserItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  page?: number;

  @ApiProperty({ required: false })
  limit?: number;

  @ApiProperty({ required: false })
  totalPages?: number;
}

export class UserResponseDto extends ResponseDto<UserItemResponseDto> {}
export class UserListResponseDto extends ResponseDto<UserListResponseDataDto> {}
