import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectLawyerRequestDto {
  @ApiProperty({
    description: 'Reason for rejecting the lawyer role application',
    example:
      'Ảnh chứng chỉ chưa rõ nét, vui lòng chụp lại thẻ luật sư hoặc chứng chỉ hành nghề.',
  })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  reason: string;
}

export class RejectLawyerRequestRequestDto extends RejectLawyerRequestDto {}
