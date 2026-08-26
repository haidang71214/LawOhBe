import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class changePass {
    @ApiProperty()
   @IsNotEmpty()
   newPass:String
   
   @ApiProperty()
   @IsNotEmpty()
   resetToken:String
}