import { ApiProperty } from "@nestjs/swagger";
import { ETypeLawyer } from "src/config/database.config";

export class CustomPriceRangeDto {
   // có id nữa,
   @ApiProperty({enum:ETypeLawyer})
   Type:ETypeLawyer;
   @ApiProperty()
   price:number;
   @ApiProperty()
   description:string
}
