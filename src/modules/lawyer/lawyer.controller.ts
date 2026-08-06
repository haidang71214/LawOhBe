import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { LawyerService } from './lawyer.service';
import {
  CreateLawyerDto,
  UpdateLawyerDto,
  FilterLawyerDto,
  ResponseDto,
  LawyerItemResponseDto,
  LawyerListResponseDataDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { AuthorizerDecorator, RoleDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { USER_ROLE } from 'libs/constant';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { CloudUploadService } from 'src/shared/cloudinary/cloudUpload.service';

@ApiTags('lawyer')
@Controller('lawyer')
export class LawyerController {
  constructor(
    private readonly lawyerService: LawyerService,
    private readonly cloudUploadService: CloudUploadService,
  ) {}

  @Get()
  async findAllLawyers(
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<LawyerListResponseDataDto>> {
    return this.lawyerService.findAllLawyers(queryDto);
  }

  @Get('/filter')
  async filterLawyers(
    @Query() filterDto: FilterLawyerDto,
  ): Promise<ResponseDto<LawyerListResponseDataDto>> {
    return this.lawyerService.filterLawyers(filterDto);
  }

  @Get('/:id')
  async getLawyerDetails(
    @Param('id') id: string,
  ): Promise<ResponseDto<LawyerItemResponseDto>> {
    return this.lawyerService.getLawyerDetails(id);
  }

  @Patch('/me')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.LAWYER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('certificate_files'))
  async updateSelfProfile(
    @Body() updateLawyerDto: UpdateLawyerDto,
    @UserData() user: AuthorizedMetadata,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ): Promise<ResponseDto<null>> {
    // Parse form-data arrays if passed as JSON string or comma-separated
    if (typeof (updateLawyerDto.type_lawyer as any) === 'string') {
      try {
        updateLawyerDto.type_lawyer = JSON.parse(
          updateLawyerDto.type_lawyer as any,
        );
      } catch {
        updateLawyerDto.type_lawyer = (
          updateLawyerDto.type_lawyer as any as string
        ).split(',') as any;
      }
    }
    if (typeof (updateLawyerDto.sub_type_lawyers as any) === 'string') {
      try {
        updateLawyerDto.sub_type_lawyers = JSON.parse(
          updateLawyerDto.sub_type_lawyers as any,
        );
      } catch {
        updateLawyerDto.sub_type_lawyers = (
          updateLawyerDto.sub_type_lawyers as any as string
        ).split(',');
      }
    }
    if (typeof (updateLawyerDto.certificate as any) === 'string') {
      try {
        updateLawyerDto.certificate = JSON.parse(
          updateLawyerDto.certificate as any,
        );
      } catch {
        updateLawyerDto.certificate = [updateLawyerDto.certificate as any];
      }
    }
    if (
      updateLawyerDto.certificate &&
      !Array.isArray(updateLawyerDto.certificate)
    ) {
      updateLawyerDto.certificate = [updateLawyerDto.certificate as any];
    }
    const existingCertificates = Array.isArray(updateLawyerDto.certificate)
      ? updateLawyerDto.certificate
      : [];

    if (files && files.length > 0) {
      const uploadResults = await this.cloudUploadService.uploadMultipleImages(
        files,
        'certificates',
      );
      const uploadedUrls = uploadResults.map((r) => r.secure_url);
      updateLawyerDto.certificate = [...existingCertificates, ...uploadedUrls];
    } else {
      updateLawyerDto.certificate = existingCertificates;
    }

    return this.lawyerService.updateSelfProfile(updateLawyerDto, user.userId);
  }

  @Patch('/:id')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'img', maxCount: 1 },
      { name: 'certificate_files', maxCount: 10 },
    ]),
  )
  async updateLawyerByAdmin(
    @Body() createLawyerDto: CreateLawyerDto,
    @UserData() user: AuthorizedMetadata,
    @Param('id') id: string,
    @UploadedFiles()
    files?: {
      img?: Express.Multer.File[];
      certificate_files?: Express.Multer.File[];
    },
  ): Promise<ResponseDto<null>> {
    if (files?.img && files.img.length > 0) {
      const uploadResult = await this.cloudUploadService.uploadImage(
        files.img[0],
        'avatar',
      );
      createLawyerDto.avartar_url = uploadResult.secure_url;
    }

    if (typeof (createLawyerDto.type_lawyer as any) === 'string') {
      try {
        createLawyerDto.type_lawyer = JSON.parse(
          createLawyerDto.type_lawyer as any,
        );
      } catch {
        createLawyerDto.type_lawyer = (
          createLawyerDto.type_lawyer as any as string
        ).split(',') as any;
      }
    }
    if (typeof (createLawyerDto.sub_type_lawyers as any) === 'string') {
      try {
        createLawyerDto.sub_type_lawyers = JSON.parse(
          createLawyerDto.sub_type_lawyers as any,
        );
      } catch {
        createLawyerDto.sub_type_lawyers = (
          createLawyerDto.sub_type_lawyers as any as string
        ).split(',');
      }
    }
    if (typeof (createLawyerDto.certificate as any) === 'string') {
      try {
        createLawyerDto.certificate = JSON.parse(
          createLawyerDto.certificate as any,
        );
      } catch {
        createLawyerDto.certificate = [createLawyerDto.certificate as any];
      }
    }
    if (
      createLawyerDto.certificate &&
      !Array.isArray(createLawyerDto.certificate)
    ) {
      createLawyerDto.certificate = [createLawyerDto.certificate as any];
    }
    const existingCertificates = Array.isArray(createLawyerDto.certificate)
      ? createLawyerDto.certificate
      : [];

    if (files?.certificate_files && files.certificate_files.length > 0) {
      const uploadResults = await this.cloudUploadService.uploadMultipleImages(
        files.certificate_files,
        'certificates',
      );
      const uploadedUrls = uploadResults.map((r) => r.secure_url);
      createLawyerDto.certificate = [...existingCertificates, ...uploadedUrls];
    } else {
      createLawyerDto.certificate = existingCertificates;
    }

    return this.lawyerService.updateLawyerByAdmin(
      createLawyerDto,
      user.userId,
      id,
    );
  }

  @Delete('/:id')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async removeLawyer(@Param('id') id: string): Promise<ResponseDto<null>> {
    return this.lawyerService.removeLawyer(id);
  }
}
