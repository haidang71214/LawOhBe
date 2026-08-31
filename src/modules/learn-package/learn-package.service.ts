import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateLearnPackageDto,
  UpdateLearnPackageDto,
  ResponseDto,
  LearnPackageItemResponseDto,
  LearnPackageListResponseDataDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { getDeletedFilter } from 'libs/utils/pagination.util';
import { RedisService, REDIS_KEYS, REDIS_TTL } from 'src/shared/redis';
import { LearnPackageRepository } from './repository/learn-package.repository';
import { LearnPackageMapper } from './mapper/learn-package.mapper';
import { UsersRepository } from '../users/repository/users.repository';

@Injectable()
export class LearnPackageService {
  constructor(
    private readonly learnPackageRepository: LearnPackageRepository,
    private readonly learnPackageMapper: LearnPackageMapper,
    private readonly usersRepository: UsersRepository,
    private readonly redisService: RedisService,
  ) {}

  async createPackage(
    createDto: CreateLearnPackageDto,
    userId: string,
  ): Promise<ResponseDto<LearnPackageItemResponseDto>> {
    const newPackage = await this.learnPackageRepository.create(createDto);

    // Invalidate cache
    await this.redisService.delByPattern('cache:learn_packages:*');

    return ResponseDto.success(
      this.learnPackageMapper.toResponseDto(newPackage),
      'Learning package created successfully',
      HttpStatus.CREATED,
    );
  }

  async findAllPackages(
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<LearnPackageListResponseDataDto>> {
    const cacheKey = REDIS_KEYS.LEARN_PACKAGE_LIST(
      JSON.stringify(queryDto || {}),
    );
    const cached =
      await this.redisService.get<LearnPackageListResponseDataDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Learning packages retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);
    const filter = getDeletedFilter(queryDto?.status_deleted);

    const { data: packages, total } =
      await this.learnPackageRepository.findWithPagination(
        filter,
        page,
        limit,
        { createdAt: -1 },
      );

    const resultData = this.learnPackageMapper.toListResponseDto(
      packages,
      total,
      page,
      limit,
    );

    await this.redisService.set(
      cacheKey,
      resultData,
      REDIS_TTL.TEN_MINUTES || REDIS_TTL.FIFTEEN_MINUTES,
    );

    return ResponseDto.success(
      resultData,
      'Learning packages retrieved successfully',
      HttpStatus.OK,
    );
  }

  async findPackageById(
    id: string,
  ): Promise<ResponseDto<LearnPackageItemResponseDto>> {
    const cacheKey = `cache:learn_packages:detail:${id}`;
    const cached =
      await this.redisService.get<LearnPackageItemResponseDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Learning package details retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const pack = await this.learnPackageRepository.findById(id);
    if (!pack) {
      throw new NotFoundException('Learning package not found');
    }

    const result = this.learnPackageMapper.toResponseDto(pack);
    await this.redisService.set(cacheKey, result, REDIS_TTL.FIFTEEN_MINUTES);

    return ResponseDto.success(
      result,
      'Learning package details retrieved successfully',
      HttpStatus.OK,
    );
  }

  async updatePackage(
    id: string,
    updateDto: UpdateLearnPackageDto,
    userId: string,
  ): Promise<ResponseDto<LearnPackageItemResponseDto>> {
    const updated = await this.learnPackageRepository.findByIdAndUpdate(
      id,
      updateDto,
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Learning package not found to update');
    }

    // Invalidate cache
    await this.redisService.delByPattern('cache:learn_packages:*');

    return ResponseDto.success(
      this.learnPackageMapper.toResponseDto(updated),
      'Learning package updated successfully',
      HttpStatus.OK,
    );
  }

  async removePackage(id: string, userId: string): Promise<ResponseDto<null>> {
    const deleted = await this.learnPackageRepository.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!deleted) {
      throw new NotFoundException('Learning package not found to delete');
    }

    // Invalidate cache
    await this.redisService.delByPattern('cache:learn_packages:*');

    return ResponseDto.success(
      null,
      'Learning package deleted successfully',
      HttpStatus.OK,
    );
  }

  async subscribePackage(
    packageId: string,
    userId: string,
  ): Promise<ResponseDto<any>> {
    const pack = await this.learnPackageRepository.findById(packageId);
    if (!pack) {
      throw new NotFoundException('Learning package not found');
    }

    const user = await this.usersRepository.findByIdAndUpdate(
      userId,
      { learn_package: (pack as any)._id },
      { new: true },
    );

    // Invalidate user and package cache
    await this.redisService.delByPattern(`cache:users:${userId}:*`);

    return ResponseDto.success(
      user,
      'Subscribed to learning package successfully',
      HttpStatus.OK,
    );
  }
}
