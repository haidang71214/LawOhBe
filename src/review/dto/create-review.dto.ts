import { Prop } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { Date } from "mongoose";

export class CreateReviewDto {
   @ApiProperty()
   rating:number
   @ApiProperty()
   comment:string
}
