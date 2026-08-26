import { ApiProperty } from "@nestjs/swagger";

export class LoginFacebookDto{
   @ApiProperty()
   id:string; // face_id
   @ApiProperty()
   full_name:string; // full_name
   @ApiProperty()
   email:string
   @ApiProperty()
   avartar_url:string
}  