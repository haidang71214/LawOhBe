import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { ETypeLawyer } from "src/config/database.config";

export class CreateFormDto {
     @ApiProperty({ type: 'string', format: 'binary',required:false })
     formFile?: any; // lấy file
     @ApiHideProperty()
     uri_secure: any
// cái form đó thuộc cái loại nào
      @ApiProperty({ enum:ETypeLawyer })
      type:ETypeLawyer
      @ApiProperty()
      mainContent:string
      @ApiProperty()
      description:string

}
