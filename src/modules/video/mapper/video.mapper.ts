import { Injectable } from '@nestjs/common';
import { Videos } from 'libs/schemas';
import { toDto, toDtoList } from 'libs/utils/mapper.util';
import { VideoItemResponseDto, VideoListResponseDataDto } from '../dto';

@Injectable()
export class VideoMapper {
  toResponseDto(video: Videos): VideoItemResponseDto {
    return toDto(VideoItemResponseDto, video);
  }

  toListResponseDto(
    videos: Videos[],
    total: number,
    page: number,
    limit: number,
  ): VideoListResponseDataDto {
    return {
      data: toDtoList(VideoItemResponseDto, videos),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
