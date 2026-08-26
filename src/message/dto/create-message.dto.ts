import { ApiProperty } from "@nestjs/swagger";
import { Types } from "mongoose";

export class CreateMessageDto {
   @ApiProperty()
   conversationId:Types.ObjectId;
   @ApiProperty()
   content:String;
   @ApiProperty()
   senderId:Types.ObjectId
}
