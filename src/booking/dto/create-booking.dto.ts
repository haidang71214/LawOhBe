import { ApiProperty } from "@nestjs/swagger";
import { ETypeLawyer } from "src/config/database.config";

export class CreateBookingDto {
   @ApiProperty()
   client_id:string
   @ApiProperty()
   lawyer_id:string
   @ApiProperty()
   booking_start:Date
   @ApiProperty()
   booking_end:Date
   @ApiProperty({ enum:ETypeLawyer })
   typeBooking:ETypeLawyer
   @ApiProperty()
   note:string
}
