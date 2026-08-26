
import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { USER_ROLE } from "src/users/dto/create-user.dto";

export class RegisterDto {
   @ApiProperty()
   @IsEmail({}, { message: 'không đúng định dạng' })
   email: string;

   @ApiProperty()
   @IsNotEmpty()
   password: string;

   @ApiProperty()
   @IsOptional()
   phone: number;

   @ApiProperty()
   name: string;

   @ApiProperty({ type: 'string', format: 'binary',required:false })
   img?: any;

   @ApiHideProperty()
   avartar_url: string;

   @ApiProperty()
   age: number;

   @ApiProperty()
   @IsEnum(USER_ROLE)
   role: USER_ROLE; // quy định cái này thuộc kiểu enum khi mới đăng kí thì có role luôn hả ?


   @ApiProperty()
   province:string;// tỉnh thành của thằng user

   @ApiProperty()
   warn:string;//warns của thằng user
}
