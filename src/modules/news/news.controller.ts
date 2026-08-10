import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { NewsService } from './news.service';
import {
  CreateNewsDto,
  ResponseDto,
  NewsItemResponseDto,
  NewsListResponseDataDto,
  AcceptRejectNewsDto,
  RejectNewsDto,
} from './dto';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CloudUploadService } from 'src/shared/cloudinary/cloudUpload.service';
import { AuthorizerDecorator, RoleDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { USER_ROLE } from 'libs/constant';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly cloudUploadService: CloudUploadService,
  ) {}

  @ApiConsumes('multipart/form-data')
  @Post()
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.LAWYER)
  @UseInterceptors(FilesInterceptor('imgs'))
  async createNews(
    @Body() createNewsDto: CreateNewsDto,
    @UserData() user: AuthorizedMetadata,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<ResponseDto<NewsItemResponseDto>> {
    if (files && files.length > 0) {
      const data = await this.cloudUploadService.uploadMultipleImages(
        files,
        'imageNews',
      );
      createNewsDto.image_urls = data.map((d) => d.secure_url);
    }
    return this.newsService.createNews(createNewsDto, user.userId);
  }

  @Get('/public')
  async getPublicNews(
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<NewsListResponseDataDto>> {
    return this.newsService.getPublicNews(queryDto);
  }

  @Get('/my-news')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.LAWYER)
  async getMyNews(
    @UserData() user: AuthorizedMetadata,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<NewsListResponseDataDto>> {
    return this.newsService.getMyNews(user.userId, queryDto);
  }

  @Get('/admin')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async getAdminNews(
    @Query('status') status: string,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<NewsListResponseDataDto>> {
    return this.newsService.getAdminNews(status, queryDto);
  }

  @Get('/:id')
  async getNewsById(
    @Param('id') id: string,
  ): Promise<ResponseDto<NewsItemResponseDto>> {
    return this.newsService.getNewsById(id);
  }

  @Patch('/:id/approve')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async approveNews(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<NewsItemResponseDto>> {
    return this.newsService.approveNews(id, user.userId);
  }

  @Patch('/:id/reject')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async rejectNews(
    @Param('id') id: string,
    @Body() body: RejectNewsDto,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<NewsItemResponseDto>> {
    return this.newsService.rejectNews(id, user.userId, body?.reason);
  }

  @Patch('/:id/moderate')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async moderateNews(
    @Param('id') id: string,
    @Body() body: AcceptRejectNewsDto,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<any>> {
    return this.newsService.moderateNews(id, body, user.userId);
  }

  @Delete('/:id')
  @AuthorizerDecorator({ secured: true })
  async removeNews(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<null>> {
    return this.newsService.removeNews(id, user.userId);
  }
}
