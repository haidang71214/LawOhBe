import { Injectable } from '@nestjs/common';
import { Booking } from 'libs/schemas';
import { toDto, toDtoList } from 'libs/utils/mapper.util';
import { BookingItemResponseDto, BookingListResponseDataDto } from '../dto';

@Injectable()
export class BookingMapper {
  toResponseDto(booking: Booking): BookingItemResponseDto {
    return toDto(BookingItemResponseDto, booking);
  }

  toListResponseDto(
    bookings: Booking[],
    total: number,
    page: number,
    limit: number,
  ): BookingListResponseDataDto {
    return {
      data: toDtoList(BookingItemResponseDto, bookings),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
