// accept-reject.enum.ts (hoặc file riêng cho enum)
export enum AcceptRejectAction {
   REJECT = 'reject',
   ACCEPT = 'accept',
 }
 
 // accept-reject.dto.ts
 import { ApiProperty } from '@nestjs/swagger';
 import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

 export class AcceptRejectDto {
   @ApiProperty({
     description: 'Lý do từ chối (nếu reject) và gửi email',
     example: 'Không phù hợp với tiêu chí',
   })
   @IsNotEmpty()
   @IsString()
   reason: string;
 
   @ApiProperty({
     enum: AcceptRejectAction,
     description: 'Hành động (reject hoặc accept)',
     example: AcceptRejectAction.ACCEPT,
   })
   @IsNotEmpty()
   @IsEnum(AcceptRejectAction)
   action: AcceptRejectAction;
 }