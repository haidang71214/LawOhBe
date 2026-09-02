import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateFormDto,
  FindAllFormDto,
  ResponseDto,
  FormItemResponseDto,
  FormListResponseDataDto,
} from './dto';
import { StorageService } from 'src/shared/storage/storage.service';
import { getDeletedFilter } from 'libs/utils/pagination.util';
import { RedisService, REDIS_TTL } from 'src/shared/redis';
import { FormRepository } from './repository/form.repository';
import { FormMapper } from './mapper/form.mapper';

@Injectable()
export class FormService {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly formMapper: FormMapper,
    private readonly storageService: StorageService,
    private readonly redisService: RedisService,
  ) {}

  async createForm(
    createFormDto: CreateFormDto,
    userId: string,
  ): Promise<ResponseDto<FormItemResponseDto>> {
    const { uri_secure, mainContent, description, type } = createFormDto;
    const newFile = await this.formRepository.create({
      uri_secure,
      mainContent,
      description,
      type,
    });

    // Invalidate cache
    await this.redisService.delByPattern('cache:forms:*');

    return ResponseDto.success(
      this.formMapper.toResponseDto(newFile),
      'Form created successfully',
      HttpStatus.CREATED,
    );
  }

  async findAllForms(
    dto: FindAllFormDto,
  ): Promise<ResponseDto<FormListResponseDataDto>> {
    const cacheKey = `cache:forms:list:${JSON.stringify(dto || {})}`;
    const cached =
      await this.redisService.get<FormListResponseDataDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Forms retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const page = Math.max(1, Number(dto?.page) || 1);
    const limit = Math.max(1, Number(dto?.limit) || 10);

    const filter: any = getDeletedFilter(dto?.status_deleted);
    if (dto?.type) {
      filter.type = dto.type;
    }

    const { data, total } = await this.formRepository.findWithPagination(
      filter,
      page,
      limit,
    );

    const resultData = this.formMapper.toListResponseDto(
      data,
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
      'Forms retrieved successfully',
      HttpStatus.OK,
    );
  }

  async findFormById(id: string): Promise<ResponseDto<FormItemResponseDto>> {
    const cacheKey = `cache:forms:detail:${id}`;
    const cached = await this.redisService.get<FormItemResponseDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Form details retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const data = await this.formRepository.findById(id);
    if (!data) {
      throw new NotFoundException('Form not found');
    }

    const result = this.formMapper.toResponseDto(data);
    await this.redisService.set(cacheKey, result, REDIS_TTL.FIFTEEN_MINUTES);

    return ResponseDto.success(
      result,
      'Form details retrieved successfully',
      HttpStatus.OK,
    );
  }

  async removeForm(id: string, userId: string): Promise<ResponseDto<null>> {
    const findPath = await this.formRepository.findById(id);
    if (!findPath) {
      throw new NotFoundException('Form not found to delete');
    }
    if (findPath?.uri_secure) {
      await this.storageService.deleteFile(findPath.uri_secure);
    }
    await this.formRepository.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date(), uri_secure: '' },
      { new: true },
    );

    // Invalidate cache
    await this.redisService.delByPattern('cache:forms:*');

    return ResponseDto.success(
      null,
      'Form deleted successfully',
      HttpStatus.OK,
    );
  }

  async downloadFormFile(
    id: string,
  ): Promise<{ fileBuffer: Buffer; fileName: string; mimeType: string }> {
    const form = await this.formRepository.findById(id);
    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }
    if (!form.uri_secure) {
      throw new NotFoundException(`No file associated with form ID ${id}`);
    }

    try {
      return await this.storageService.downloadFile(form.uri_secure);
    } catch (error: any) {
      throw new BadRequestException(`Error downloading file: ${error.message}`);
    }
  }
}
