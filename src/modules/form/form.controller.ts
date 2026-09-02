import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
  UseInterceptors,
  UploadedFile,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { FormService } from './form.service';
import {
  CreateFormDto,
  FindAllFormDto,
  ResponseDto,
  FormItemResponseDto,
  FormListResponseDataDto,
} from './dto';
import { Response } from 'express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from 'src/shared/storage/storage.service';
import { AuthorizerDecorator, RoleDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { USER_ROLE } from 'libs/constant';

@ApiTags('form')
@Controller('form')
export class FormController {
  constructor(
    private readonly formService: FormService,
    private readonly storageService: StorageService,
  ) {}

  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('formFile'))
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  @Post()
  async createForm(
    @Body() createFormDto: CreateFormDto,
    @UploadedFile() file: Express.Multer.File,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<FormItemResponseDto>> {
    if (file) {
      const uri = await this.storageService.saveFile(file);
      createFormDto.uri_secure = uri;
    }
    return this.formService.createForm(createFormDto, user.userId);
  }

  @Get()
  async findAllForms(
    @Query() dto: FindAllFormDto,
  ): Promise<ResponseDto<FormListResponseDataDto>> {
    return this.formService.findAllForms(dto);
  }

  @Get('/:id')
  async findFormById(
    @Param('id') id: string,
  ): Promise<ResponseDto<FormItemResponseDto>> {
    return this.formService.findFormById(id);
  }

  @Delete('/:id')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async removeForm(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<null>> {
    return this.formService.removeForm(id, user.userId);
  }

  @Get('/:id/download')
  async downloadFormFile(@Param('id') id: string, @Res() res: Response) {
    try {
      const { fileBuffer, fileName, mimeType } =
        await this.formService.downloadFormFile(id);
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      });
      res.status(HttpStatus.OK).send(fileBuffer);
    } catch (error: any) {
      res.status(error.status || HttpStatus.BAD_REQUEST).json({
        message: error.message || 'Error downloading file',
      });
    }
  }
}
