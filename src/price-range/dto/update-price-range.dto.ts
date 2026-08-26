import { ApiProperty } from "@nestjs/swagger";
import { ETypeLawyer } from "src/config/database.config";

export class UpdatePriceRangeDto {
   @ApiProperty()
   minPrice:number;
   @ApiProperty()
   maxPrice:number;
   @ApiProperty()
   description:string
}
