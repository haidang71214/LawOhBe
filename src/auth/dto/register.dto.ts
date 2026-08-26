
import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional } from "class-validator";
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
   img?: any; // lấy ảnh lên

   @ApiHideProperty()
   avartar_url: string; // lưu url về

   @ApiProperty()
   age: number;

   @ApiProperty()
   province:string;// tỉnh thành của thằng user

}
