import { ApiProperty } from '@nestjs/swagger';
import { ETypeLawyer } from 'libs/schemas';

export class CreateBookingDto {
  @ApiProperty({ required: false })
  client_id?: string;

  @ApiProperty()
  lawyer_id: string;

  @ApiProperty()
  booking_start: Date;

  @ApiProperty()
  booking_end: Date;

  @ApiProperty({ enum: ETypeLawyer })
  typeBooking: ETypeLawyer;

  @ApiProperty({ required: false })
  note?: string;
}

export class CreateBookingRequestDto extends CreateBookingDto {}
