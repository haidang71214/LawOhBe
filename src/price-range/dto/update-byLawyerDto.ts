import { ApiProperty } from "@nestjs/swagger";
import { ETypeLawyer } from "src/config/database.config";

export class updatePriceBylawyerDto {
   // có id nữa,
   @ApiProperty({enum:ETypeLawyer})
   Type:ETypeLawyer;
   @ApiProperty()
   price:number;
   @ApiProperty()
   description:string
}
