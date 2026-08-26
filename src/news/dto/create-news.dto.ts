import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { ETypeLawyer } from "src/config/database.config";

export class CreateNewsDto {
   @ApiProperty({ enum:ETypeLawyer })
   type:ETypeLawyer
   @ApiProperty()
   mainTitle:string

   @ApiProperty({ type: String })
   content: string;

   @ApiHideProperty()
   image_urls: string[];

   @ApiProperty({ type: [String], format: 'binary', required: false })
   imgs?: any[];
}