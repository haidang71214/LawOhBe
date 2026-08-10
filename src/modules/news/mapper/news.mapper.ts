import { Injectable } from '@nestjs/common';
import { New } from 'libs/schemas';
import { toDto, toDtoList } from 'libs/utils/mapper.util';
import { NewsItemResponseDto, NewsListResponseDataDto } from '../dto';

@Injectable()
export class NewsMapper {
  toResponseDto(news: New): NewsItemResponseDto {
    const raw = (news as any)?._doc || news;
    const dto = toDto(NewsItemResponseDto, news);
    if (!dto.image_urls || dto.image_urls.length === 0) {
      dto.image_urls = raw?.image_url || raw?.image_urls || [];
    }
    if (!dto.type && raw?.type) dto.type = raw.type;
    if (!dto.mainTitle && raw?.mainTitle) dto.mainTitle = raw.mainTitle;
    if (!dto.content && raw?.content) dto.content = raw.content;
    if (raw?.status) dto.status = raw.status;
    if (raw?.rejectReason !== undefined) dto.rejectReason = raw.rejectReason;
    if (raw?.userId) dto.userId = raw.userId;
    if (dto.isAccept === undefined && raw?.isAccept !== undefined) {
      dto.isAccept = raw.isAccept;
    }
    return dto;
  }

  toListResponseDto(
    newsList: New[],
    total: number,
    page: number,
    limit: number,
  ): NewsListResponseDataDto {
    const mapped = (newsList || []).map((n) => this.toResponseDto(n));
    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / (limit || 10)) || 1,
    };
  }
}
