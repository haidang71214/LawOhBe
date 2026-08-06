import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  UpdateLawyerDto,
  FilterLawyerDto,
  CreateLawyerDto,
  ResponseDto,
  LawyerItemResponseDto,
  LawyerListResponseDataDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { getDeletedFilter } from 'libs/utils/pagination.util';
import { RedisService, REDIS_KEYS, REDIS_TTL } from 'src/shared/redis';
import { UsersRepository } from '../users/repository/users.repository';
import { TypeLawyerRepository } from './repository/type-lawyer.repository';
import { SubTypeLawyerRepository } from './repository/sub-type-lawyer.repository';
import { CustomPriceRepository } from './repository/custom-price.repository';
import { LawyerMapper } from './mapper/lawyer.mapper';
import { escapeRegex } from 'libs/utils/regex.util';

@Injectable()
export class LawyerService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly typeLawyerRepository: TypeLawyerRepository,
    private readonly subTypeLawyerRepository: SubTypeLawyerRepository,
    private readonly customPriceRepository: CustomPriceRepository,
    private readonly lawyerMapper: LawyerMapper,
    private readonly redisService: RedisService,
  ) {}

  async findAllLawyers(
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<LawyerListResponseDataDto>> {
    const cacheKey = REDIS_KEYS.LAWYER_LIST(JSON.stringify(queryDto || {}));
    const cached =
      await this.redisService.get<LawyerListResponseDataDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Lawyers retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const filter = {
      role: 'lawyer',
      ...getDeletedFilter(queryDto?.status_deleted),
    };

    const { data: response, total } =
      await this.usersRepository.findWithPagination(filter, page, limit, {
        createdAt: -1,
      });

    const resultData = this.lawyerMapper.toListResponseDto(
      response,
      total,
      page,
      limit,
    );

    await this.redisService.set(cacheKey, resultData, REDIS_TTL.FIVE_MINUTES);

    return ResponseDto.success(
      resultData,
      'Lawyers retrieved successfully',
      HttpStatus.OK,
    );
  }

  async updateSelfProfile(
    updateLawyerDto: UpdateLawyerDto,
    userId: string,
  ): Promise<ResponseDto<null>> {
    const thisLawyer = await this.usersRepository.findById(userId);
    if (!thisLawyer || thisLawyer.role !== 'lawyer') {
      throw new ForbiddenException('Only lawyers can update this profile');
    }

    const description =
      updateLawyerDto.description !== undefined
        ? updateLawyerDto.description
        : thisLawyer.description;
    const experienceYear =
      updateLawyerDto.experienceYear !== undefined
        ? updateLawyerDto.experienceYear
        : thisLawyer.experienceYear;
    const certificate =
      updateLawyerDto.certificate !== undefined
        ? updateLawyerDto.certificate
        : thisLawyer.certificate || [];
    const type_lawyer = updateLawyerDto.type_lawyer;
    const sub_type_lawyers = updateLawyerDto.sub_type_lawyers;

    if (
      type_lawyer &&
      (thisLawyer.typeLawyer === null || thisLawyer.typeLawyer === undefined)
    ) {
      const newTypeLawyer = await this.typeLawyerRepository.create({
        type: type_lawyer,
        lawyer_id: thisLawyer._id,
      });
      await this.usersRepository.findByIdAndUpdate(userId, {
        typeLawyer: newTypeLawyer._id,
        description,
        experienceYear,
        certificate,
      });

      if (sub_type_lawyers && sub_type_lawyers.length > 0) {
        await Promise.all(
          sub_type_lawyers.map(async (name) => {
            await this.subTypeLawyerRepository.create({
              name,
              parentType: newTypeLawyer._id,
            });
          }),
        );
      }
    } else {
      if (type_lawyer && thisLawyer.typeLawyer) {
        await this.typeLawyerRepository.findByIdAndUpdate(
          thisLawyer.typeLawyer,
          {
            type: type_lawyer,
          },
        );
      }
      await this.usersRepository.findByIdAndUpdate(userId, {
        description,
        experienceYear,
        certificate,
      });

      if (sub_type_lawyers && thisLawyer.typeLawyer) {
        const currentSubTypes =
          await this.subTypeLawyerRepository.findByParentType(
            thisLawyer.typeLawyer,
          );
        const currentNames = currentSubTypes.map(
          (sub) => sub.name || sub.subType || '',
        );

        const toDelete = currentSubTypes.filter(
          (sub) => !sub_type_lawyers.includes(sub.name || sub.subType || ''),
        );
        await this.subTypeLawyerRepository.deleteMany({
          _id: { $in: toDelete.map((sub) => sub._id) },
        });

        const toAdd = sub_type_lawyers.filter(
          (name) => !currentNames.includes(name),
        );
        await Promise.all(
          toAdd.map(async (name) => {
            await this.subTypeLawyerRepository.create({
              name,
              parentType: thisLawyer.typeLawyer,
            });
          }),
        );
      }
    }

    if (sub_type_lawyers && sub_type_lawyers.length > 0) {
      const existingCustomPrices =
        await this.customPriceRepository.findByLawyerId(userId);

      const typesToKeep = sub_type_lawyers;
      await this.customPriceRepository.deleteMany({
        lawyer_id: userId,
        type: { $nin: typesToKeep },
      });

      await Promise.all(
        sub_type_lawyers.map(async (type) => {
          const existingPrice = existingCustomPrices.find(
            (cp) => cp.type === type,
          );

          if (existingPrice) {
            await this.customPriceRepository.findOneAndUpdate(
              { lawyer_id: userId, type },
              { $set: { price: existingPrice.price } },
            );
          } else {
            await this.customPriceRepository.findOneAndUpdate(
              { lawyer_id: userId, type },
              {
                lawyer_id: userId,
                type,
                price: 0,
                description: 'Default',
              },
              { upsert: true },
            );
          }
        }),
      );
    }

    // Invalidate cache
    await this.redisService.delByPattern('cache:lawyers:*');

    return ResponseDto.success(
      null,
      'Profile updated successfully',
      HttpStatus.OK,
    );
  }

  async updateLawyerByAdmin(
    createLawyerDto: CreateLawyerDto,
    userId: string,
    id: string,
  ): Promise<ResponseDto<null>> {
    const {
      description,
      type_lawyer,
      sub_type_lawyers,
      experienceYear,
      name,
      phone,
      age,
      province,
      avartar_url,
    } = createLawyerDto;

    const findUser = await this.usersRepository.findById(id);
    if (!findUser) {
      throw new NotFoundException('Lawyer not found');
    }

    const certificate =
      createLawyerDto.certificate !== undefined
        ? createLawyerDto.certificate
        : findUser.certificate || [];

    if (!findUser.typeLawyer) {
      const newTypeLawyer = await this.typeLawyerRepository.create({
        type: type_lawyer,
        lawyer_id: new Types.ObjectId(id),
      });

      await this.usersRepository.findByIdAndUpdate(
        id,
        {
          name,
          phone,
          age,
          province,
          avartar_url,
          role: 'lawyer',
          typeLawyer: newTypeLawyer._id,
          description,
          experienceYear,
          certificate,
        },
        { new: true },
      );

      if (sub_type_lawyers && sub_type_lawyers.length > 0) {
        await Promise.all(
          sub_type_lawyers.map(async (subName) => {
            await this.subTypeLawyerRepository.create({
              name: subName,
              parentType: newTypeLawyer._id,
            });
          }),
        );
      }
    } else {
      await this.typeLawyerRepository.findByIdAndUpdate(findUser.typeLawyer, {
        type: type_lawyer,
      });

      await this.usersRepository.findByIdAndUpdate(id, {
        name,
        phone,
        age,
        province,
        avartar_url,
        role: 'lawyer',
        description,
        experienceYear,
        certificate,
      });

      const currentSubTypes =
        await this.subTypeLawyerRepository.findByParentType(
          findUser.typeLawyer,
        );
      const currentNames = currentSubTypes.map(
        (sub) => sub.name || sub.subType || '',
      );

      const toDelete = currentSubTypes.filter(
        (sub) => !sub_type_lawyers?.includes(sub.name || sub.subType || ''),
      );
      await this.subTypeLawyerRepository.deleteMany({
        _id: { $in: toDelete.map((sub) => sub._id) },
      });

      const toAdd = (sub_type_lawyers || []).filter(
        (subName) => !currentNames.includes(subName),
      );
      await Promise.all(
        toAdd.map(async (subName) => {
          await this.subTypeLawyerRepository.create({
            name: subName,
            parentType: findUser.typeLawyer,
          });
        }),
      );
    }

    const existingCustomPrices =
      await this.customPriceRepository.findByLawyerId(id);

    const typesToKeep = sub_type_lawyers || [];
    await this.customPriceRepository.deleteMany({
      lawyer_id: id,
      type: { $nin: typesToKeep },
    });

    await Promise.all(
      (sub_type_lawyers || []).map(async (type) => {
        const existingPrice = existingCustomPrices.find(
          (cp) => cp.type === type,
        );

        if (existingPrice) {
          await this.customPriceRepository.findOneAndUpdate(
            { lawyer_id: id, type },
            { $set: { price: existingPrice.price } },
          );
        } else {
          await this.customPriceRepository.findOneAndUpdate(
            { lawyer_id: id, type },
            {
              lawyer_id: id,
              type,
              price: 0,
              description: 'Default',
            },
            { upsert: true },
          );
        }
      }),
    );

    // Invalidate cache
    await this.redisService.delByPattern('cache:lawyers:*');

    return ResponseDto.success(
      null,
      `Lawyer with ID ${id} has been updated successfully`,
      HttpStatus.OK,
    );
  }

  async filterLawyers(
    filterDto: FilterLawyerDto,
  ): Promise<ResponseDto<LawyerListResponseDataDto>> {
    const cacheKey = REDIS_KEYS.LAWYER_LIST(JSON.stringify(filterDto));
    const cached =
      await this.redisService.get<LawyerListResponseDataDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Lawyers retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const {
      stars,
      typeLawyer,
      province,
      page = 1,
      limit = 10,
      status_deleted,
    } = filterDto;
    const query: any = {
      role: 'lawyer',
      ...getDeletedFilter(status_deleted),
    };

    if (stars !== undefined) {
      query.star = stars;
    }

    if (typeLawyer) {
      const typeLawyers =
        await this.typeLawyerRepository.findByTypeRegex(typeLawyer);
      const lawyerIds = typeLawyers.map((type) => type.lawyer_id);

      if (lawyerIds.length > 0) {
        query._id = { $in: lawyerIds };
      } else {
        return ResponseDto.success(
          {
            data: [],
            total: 0,
            page: Number(page),
            limit: Number(limit),
            totalPages: 0,
          },
          'No matching lawyers found',
          HttpStatus.OK,
        );
      }
    }

    if (province) {
      query.province = { $regex: escapeRegex(province), $options: 'i' };
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 10);

    const { data, total } = await this.usersRepository.findWithPagination(
      query,
      pageNumber,
      limitNumber,
      { star: -1 },
      'typeLawyer',
    );

    const resultData = this.lawyerMapper.toListResponseDto(
      data,
      total,
      pageNumber,
      limitNumber,
    );

    await this.redisService.set(cacheKey, resultData, REDIS_TTL.FIVE_MINUTES);

    return ResponseDto.success(
      resultData,
      'Lawyers retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getLawyerDetails(
    id: string,
  ): Promise<ResponseDto<LawyerItemResponseDto>> {
    const cacheKey = REDIS_KEYS.LAWYER_DETAIL(id);
    const cached = await this.redisService.get<LawyerItemResponseDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Lawyer details retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const data = await this.usersRepository.findById(id, {
      path: 'typeLawyer',
    });

    if (!data || !data.typeLawyer) {
      throw new NotFoundException('Lawyer not found');
    }

    const subTypes = await this.subTypeLawyerRepository.findByParentType(
      (data.typeLawyer as any)._id,
    );

    const customPrice = await this.customPriceRepository.findByLawyerId(
      data._id?.toString() || data.id,
    );

    const composite = {
      ...((data as any).toObject ? (data as any).toObject() : data),
      subTypes,
      customPrice,
    };

    const result = this.lawyerMapper.toResponseDto(composite);
    await this.redisService.set(cacheKey, result, REDIS_TTL.FIVE_MINUTES);

    return ResponseDto.success(
      result,
      'Lawyer details retrieved successfully',
      HttpStatus.OK,
    );
  }

  async removeLawyer(id: string): Promise<ResponseDto<null>> {
    const lawyer = await this.usersRepository.findOneAndUpdate(
      { _id: id, role: 'lawyer' },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );

    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }

    await this.redisService.delByPattern('cache:lawyers:*');
    await this.redisService.delByPattern('cache:users:*');

    return ResponseDto.success(
      null,
      `Lawyer ${lawyer.name || id} removed successfully`,
      HttpStatus.OK,
    );
  }
}
