import { Injectable } from '@nestjs/common';
import { User } from 'libs/schemas';
import { toDto, toDtoList } from 'libs/utils/mapper.util';
import { UserItemResponseDto, UserListResponseDataDto } from '../dto';

@Injectable()
export class UsersMapper {
  toResponseDto(user: User): UserItemResponseDto {
    return toDto(UserItemResponseDto, user);
  }

  toListResponseDto(
    users: User[],
    total: number,
    page: number,
    limit: number,
  ): UserListResponseDataDto {
    return {
      data: toDtoList(UserItemResponseDto, users),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
