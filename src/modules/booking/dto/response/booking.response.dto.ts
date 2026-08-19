import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class BookingItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  client_id: any;

  @ApiProperty()
  lawyer_id: any;

  @ApiProperty()
  booking_start: Date;

  @ApiProperty()
  booking_end: Date;

  @ApiProperty()
  typeBooking: string;

  @ApiProperty({ required: false })
  note?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ required: false })
  isDeleted?: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class BookingListResponseDataDto {
  @ApiProperty({ type: [BookingItemResponseDto] })
  data: BookingItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  page?: number;

  @ApiProperty({ required: false })
  limit?: number;

  @ApiProperty({ required: false })
  totalPages?: number;
}

export class BookingResponseDto extends ResponseDto<BookingItemResponseDto> {}
export class BookingListResponseDto extends ResponseDto<BookingListResponseDataDto> {}
