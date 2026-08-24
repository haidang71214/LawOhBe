import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AcceptRejectAction } from 'libs/constant';

export class AcceptRejectDto {
  @ApiProperty({
    description:
      'Reason for rejection (if reject) or approval note to send via email',
    example: 'Does not meet the platform guidelines',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({
    enum: AcceptRejectAction,
    description: 'Action (reject or accept)',
    example: AcceptRejectAction.ACCEPT,
  })
  @IsNotEmpty()
  @IsEnum(AcceptRejectAction)
  action: AcceptRejectAction;
}

export class AcceptRejectVideoRequestDto extends AcceptRejectDto {}
