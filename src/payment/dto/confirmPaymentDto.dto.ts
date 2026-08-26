import { ApiProperty } from "@nestjs/swagger";

export class CreatePaymentDto {
   // client id với orderinfor là được rồi
   @ApiProperty()
   amount:number
   @ApiProperty()
   orderInfo:string
   @ApiProperty()
   orderType:string
   @ApiProperty()
   bankCode:string
   @ApiProperty()
   clientId: string
   @ApiProperty()
   lawyerId: string
}
