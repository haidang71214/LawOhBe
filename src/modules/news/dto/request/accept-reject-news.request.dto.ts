import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AcceptRejectAction } from 'libs/constant';

export class AcceptRejectNewsDto {
  @ApiPropertyOptional({
    description: 'Reason for rejection (if reject) or approval note',
    example: 'Nội dung chưa phù hợp với tiêu chuẩn cộng đồng',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    enum: AcceptRejectAction,
    description: 'Action (reject or accept)',
    example: AcceptRejectAction.ACCEPT,
  })
  @IsNotEmpty()
  @IsEnum(AcceptRejectAction)
  action: AcceptRejectAction;
}

export class RejectNewsDto {
  @ApiPropertyOptional({
    description: 'Reason for rejection',
    example: 'Nội dung chưa phù hợp với tiêu chuẩn cộng đồng',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
