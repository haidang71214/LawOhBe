import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class CreateCommentDto {
   // chỗ này mình lấy cái parent_comment_id
   @ApiProperty()
   @IsOptional()
   parent_comment_id:string
   @ApiProperty()
   content:string
}
