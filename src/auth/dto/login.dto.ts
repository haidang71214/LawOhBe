import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class loginDto{
   @ApiProperty()
   @IsNotEmpty()
   email:String;
   
   @ApiProperty()
   @IsNotEmpty()
   password:String;
}