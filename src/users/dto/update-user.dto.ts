
import {  USER_ROLE } from './create-user.dto';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserDto {
    // không update mail

   
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
      role: USER_ROLE; // quy định cái này thuộc kiểu enum
   
      @ApiProperty()
      province:string;// tỉnh thành của thằng user
   
}