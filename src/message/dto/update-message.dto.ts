import { IsArray, ArrayMinSize, IsMongoId } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(2, { message: 'Phải có ít nhất 2 người tham gia' }) // tối thiểu 2 user trong cuộc chat
  @IsMongoId({ each: true, message: 'Mỗi phần tử phải là ObjectId hợp lệ' }) // mỗi phần tử là id hợp lệ của Mongo
  participants: string[];
}
