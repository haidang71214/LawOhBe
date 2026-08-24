import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

export { ResponseDto };

export class VideoItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  categories: string;

  @ApiProperty({ required: false })
  thubnail_url?: string;

  @ApiProperty({ required: false })
  video_url?: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  author_id: any;
}

export class VideoListResponseDataDto {
  @ApiProperty({ type: [VideoItemResponseDto] })
  data: VideoItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty({ required: false })
  limit?: number;

  @ApiProperty()
  totalPages: number;
}

export class VideoResponseDto extends ResponseDto<VideoItemResponseDto> {}
export class VideoListResponseDto extends ResponseDto<VideoListResponseDataDto> {}
