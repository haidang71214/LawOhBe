import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class SendToken{
   @ApiProperty()
   @IsNotEmpty()
   email:String;
}