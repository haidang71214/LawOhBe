import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty } from "class-validator";
import { VideoLawCategory } from "src/config/database.config";

export class CreateVideoDto {
   @ApiProperty({
      enum: VideoLawCategory,
    })
    @IsNotEmpty()
    categories: VideoLawCategory;
   @ApiProperty({type:'string',format:'binary',required:false})
   thubnail?:any
   @ApiHideProperty()
   thubnail_url:string// chỗ để lưu cái thubnail về 
   @ApiProperty({ type: 'string', format: 'binary',required:false })
   video?: any; // lấy video lên
   @ApiHideProperty()
   video_url: string; // lưu url về

   @ApiProperty()
   description:string
}
