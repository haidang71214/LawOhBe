// export class UpdateLawyerDto {}
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { ETypeLawyer } from 'src/config/database.config';

export class CreateLawyerDto{
   // description,type_lawyer,sup_type_lawyers
   @ApiProperty()
   description:string;
// chỗ này sẽ lưu những cái id của thằng type, nó sẽ gửi id thôi ha
@ApiProperty({
    description: 'Danh sách loại luật sư',
    isArray: true,
    enum:ETypeLawyer,
    type: String, // Thay đổi thành String vì đây là ObjectId
    example: [ "INSURANCE","FAMILY"] // Là các loại luật sư
  })
  @IsArray()
  // @IsMongoId({ each: true }) // Kiểm tra từng ID có phải là ObjectId hợp lệ
  type_lawyer: ETypeLawyer[]; // Kiểu là Array của ObjectId

// này sẽ qui định những thằng type con
 @ApiProperty({
    type: [String],
    example:['bảo hiểm nhân thọ','cái gì gì đó'],
    description: 'Danh sách các loại luật sư con (VD: bảo hiểm nhân thọ, bảo hiểm thất nghiệp...)'
  })
  sub_type_lawyers: string[];

  @ApiProperty() // mô tả năm kinh nghiệm
  experienceYear:number;
  @ApiProperty() // mô tả học vấn
  certificate: string[];

}
