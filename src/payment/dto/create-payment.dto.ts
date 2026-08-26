import { ApiProperty } from "@nestjs/swagger";

export class CreatePaymentDto {
   // client id với orderinfor là được rồi
   // thiếu cái booking_id
   @ApiProperty()
   amount:number
   @ApiProperty()
   orderInfo:string
   @ApiProperty()
   orderType:string
   @ApiProperty()
   bankCode:string
   @ApiProperty({required:true})
   clientId: string
   @ApiProperty({required:true})
   lawyerId: string
   // bỏ thêm cái booking id để check thành công hay chưa
   @ApiProperty()
   bookingId:string
}
